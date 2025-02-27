import UspMp from '../uspmp-api.js'
import fs from 'node:fs'
import path from 'node:path'

const uspmp = new UspMp({
  httpsConfig: {
    cert: fs.readFileSync(process.env.USPMP_CLIENT_CERT_PEM_FILE),
    key: fs.readFileSync(process.env.USPMP_CLIENT_KEY_PEM_FILE),
    ca: fs.readFileSync(process.env.USPMP_CA_CERTS_PEM_FILE),
  },
  demoServer: true
})

const deliveryIds = await uspmp.queryDeliveries({ newDeliveriesOnly: false })
console.log(deliveryIds)

for (const deliveryId of deliveryIds) {
  const delivery = await uspmp.getDelivery(deliveryId)
  console.log(delivery)

  for (const attachment of delivery.attachments) {
    if (!attachment.mimeType.startsWith('text/')) {
      fs.writeFileSync(path.join(process.env.HOME, 'Downloads', attachment.filename), attachment.data)
    }
  }

  await uspmp.closeDelivery(deliveryId)
}