#!/bin/bash
ls sslforfree
unzip sslforfree/dariomac.com.zip -d sslforfree/
cp sslforfree/certificate.crt sslforfree/server.crt
echo "" >> sslforfree/server.crt
cat sslforfree/ca_bundle.crt >> sslforfree/server.crt
scp sslforfree/server.crt dariomac@dariomac.com:~/cert/server.crt.$(date '+%Y%m%d%H%M%S').bkp
scp sslforfree/server.crt dariomac@dariomac.com:~/cert/
scp sslforfree/private.key dariomac@dariomac.com:~/cert/private.key.$(date '+%Y%m%d%H%M%S').bkp
scp sslforfree/private.key dariomac@dariomac.com:~/cert/
