# USP Mein Postkorb Autoabholung node for Node-RED

This package provides a node for [Node-RED](https://nodered.org/) to access the Automatische Abholung of *Mein Postkorb* of the Austrian *Unternehmensserviceportal* (see references). You can retrieve new or all deliveries (Nachrichten) and you can close a delivery (mark it as not new).

# Installation

```
npm i @vrilcode/node-red-uspmp
```

# Usage without Node-RED

You can use this package also with your regular JS/TS application without Node-RED. An example code is provided in `contrib/uspmp-client.mjs`, which can be executed via `npm run client`, if an according `.env` file exists.

# References

* Austrian [Unternehmensserviceportal](https://www.usp.gv.at/)
* [Mein Postkorb Automatische Abholung HowTo](https://www.usp.gv.at/at.gv.mpk-p/aadocs/Mein_Postkorb_AutomatischeAbholung_HowTo.pdf)
* [GitHub](https://github.com/vrilcode/node-red-uspmp) - GitHub repository of this node