const axios = require('axios').default
const https = require('node:https')
const cheerio = require('cheerio')

module.exports = class UspMp {
  http

  constructor({ httpsConfig, demoServer = false } = {}) {
    const baseURL = `https://${demoServer ? 'demo-' : ''}autoabholung.meinpostkorb.brz.gv.at`
    const httpsAgent = new https.Agent(httpsConfig)

    this.http = axios.create({
      baseURL,
      timeout: 60 * 1000,
      httpsAgent
    })   
  }

  async #soapCall(soapRequest) {
    const res = await this.http.post('/soap', soapRequest, { headers: { 'Content-Type': 'application/soap+xml; charset=utf-8' } })
    return res.data
  }

  async queryDeliveries({ newDeliveriesOnly = true } = {}) {
    const queryAllDeliveriesRequest = `<?xml version="1.0" encoding="UTF-8"?>
      <env:Envelope xmlns:env="http://www.w3.org/2003/05/soap-envelope">
        <env:Header/>
        <env:Body>
          <aa:QueryDeliveriesRequest xmlns:aa="http://reference.e-government.gv.at/namespace/zustellung/autoabholung/phase2/20181206#">
            <aa:AllDeliveries>
              <aa:Paging>
                <aa:Start>0</aa:Start>
                <aa:Limit>100</aa:Limit>
              </aa:Paging>
            </aa:AllDeliveries>
          </aa:QueryDeliveriesRequest>
        </env:Body>
      </env:Envelope>
    `

    const queryNewDeliveriesRequest = `<?xml version="1.0" encoding="UTF-8"?>
      <env:Envelope xmlns:env="http://www.w3.org/2003/05/soap-envelope">
        <env:Header/>
        <env:Body>
          <aa:QueryDeliveriesRequest xmlns:aa="http://reference.e-government.gv.at/namespace/zustellung/autoabholung/phase2/20181206#">
            <aa:NewDeliveriesOnly>
              <aa:Limit>100</aa:Limit>
            </aa:NewDeliveriesOnly>
          </aa:QueryDeliveriesRequest>
        </env:Body>
      </env:Envelope>
    `

    const queryDeliveriesResponse = await this.#soapCall(
      newDeliveriesOnly ? queryNewDeliveriesRequest : queryAllDeliveriesRequest
    )
    const $ = cheerio.load(queryDeliveriesResponse, { xmlMode: true })

    const deliveryIds = $('aa\\:DeliveryID')
      .map((_, el) => $(el).text())
      .get()

    return deliveryIds
  }

  async getDelivery(id, { downloadAttachments = true } = {}) {
    const getDeliveryRequest = `<?xml version="1.0" encoding="UTF-8"?>
      <env:Envelope xmlns:env="http://www.w3.org/2003/05/soap-envelope">
        <env:Header/>
        <env:Body>
          <aa:GetDeliveryRequest xmlns:aa="http://reference.e-government.gv.at/namespace/zustellung/autoabholung/phase2/20181206#">
            <aa:DeliveryID>${id}</aa:DeliveryID>
          </aa:GetDeliveryRequest>
        </env:Body>
      </env:Envelope>
    `

    const getDeliveryResponse = await this.#soapCall(getDeliveryRequest)
    const $ = cheerio.load(getDeliveryResponse, { xmlMode: true })

    const sender = $('aa\\:Sender p\\:CorporateBody p\\:FullName').text()
    const subject = $('msg\\:Subject').text()
    const timestamp = $('msg\\:DeliveryTimestamp').text()
    const quality = $('msg\\:DeliveryQuality').text()

    const attachments = $('aa\\:Attachment').map((_, el) => ({
      id: $(el).find('aa\\:AttachmentID').text(),
      filename: $(el).find('aa\\:FileName').text(),
      mimeType: $(el).find('msg\\:MimeType').text(),
      documentClass: $(el).find('msg\\:DocumentClass').text() || undefined,
    })).get()

    const delivery = {
      id,
      sender,
      timestamp,
      subject,
      quality,
      attachments
    }

    if (downloadAttachments) {
      for (const attachment of attachments) {
        const res = await this.http.get('/attachment', {
          params: {
            'delivery_id': id,
            'attachment_id': attachment.id,
          },
          responseType: attachment.mimeType.startsWith('text/') ? 'text' : 'arraybuffer',
        })

        attachment.data = res.data
      }
    }

    return delivery
  }

  async closeDelivery(id) {
    const closeDeliveryRequest = `<?xml version="1.0" encoding="UTF-8"?>
      <env:Envelope xmlns:env="http://www.w3.org/2003/05/soap-envelope">
        <env:Header/>
        <env:Body>
          <aa:CloseDeliveryRequest xmlns:aa="http://reference.e-government.gv.at/namespace/zustellung/autoabholung/phase2/20181206#">
            <aa:DeliveryID>${id}</aa:DeliveryID>
          </aa:CloseDeliveryRequest>
        </env:Body>
      </env:Envelope>`
    
    const closeDeliveryResponse = await this.#soapCall(closeDeliveryRequest)

    const $ = cheerio.load(closeDeliveryResponse, { xmlMode: true })
    return $('aa\\:CloseDeliveryResponse aa\\:Success').text() === 'true'
  }
}
