const UspMp = require('./uspmp-api')

module.exports = function(RED) {
  function UspmpGetNode(config) {
    RED.nodes.createNode(this, config)
    var node = this
    node.config = config
    
    // Retrieve the TLS config
    const tlsConfig = RED.nodes.getNode(config.tlsConfig)

    // Initialize
    const uspmp = new UspMp({
      httpsConfig: {
        cert: tlsConfig.cert,
        key: tlsConfig.key,
        ca: tlsConfig.ca,
      },
    })
    
    node.on('input', async function(msg, send, done) {
      msg.payload = []

      console.log(node.config)

      try {
        node.status({ fill: 'blue', shape: 'dot', text: 'requesting' })
        const deliveryIds = await uspmp.queryDeliveries({
          newDeliveriesOnly: node.config.newDeliveriesOnly === 'yes'
        })
        node.status({})

        // console.log(deliveryIds)

        for (const deliveryId of deliveryIds) {
          node.status({ fill: 'blue', shape: 'dot', text: 'requesting' })
          const delivery = await uspmp.getDelivery(deliveryId)
          node.status({})

          // console.log(delivery)
          msg.payload.push(delivery)
        }
      } catch (err) {
        node.status({ fill: 'red', shape: 'ring', text: err.code ? `${err.code} (${err.status})` : 'error' })
        done(err)
        return
      }
      
      send(msg)
      done()
    })
  }

  RED.nodes.registerType('uspmp-get', UspmpGetNode)
}
