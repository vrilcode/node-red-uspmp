#!/usr/bin/env bash

openssl s_client \
  -connect autoabholung.meinpostkorb.brz.gv.at:443 \
  -showcerts \
  | sed -n '/-----BEGIN CERTIFICATE-----/,/-----END CERTIFICATE-----/p' \
> meinpostkorb.ca.crt.pem
