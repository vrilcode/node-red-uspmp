const UspMp = require('./uspmp-api')

module.exports = function(RED) {
  function UspmpCloseNode(config) {
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
      try {
        const deliveryId = RED.util.getMessageProperty(msg, node.config.deliveryIdProperty || 'payload.id');

        node.status({ fill: 'blue', shape: 'dot', text: 'requesting' })
        const result = await uspmp.closeDelivery(deliveryId)
        msg.payload = result

        node.status({})
      } catch (err) {
        node.status({ fill: 'red', shape: 'ring', text: err.code ? `${err.code} (${err.status})` : 'error' })
        done(err)
        return
      }
      
      send(msg)
      done()
    })
  }

  RED.nodes.registerType('uspmp-close', UspmpCloseNode)
}
