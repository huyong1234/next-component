#/bin/sh
echo "=== build ===" \
&& tsc --lib es7 init/listItem.ts \
&& tsc --lib es7 init/listNormCalculateRule.ts \
&& tsc --lib es7 init/listNormCatalog.ts \
&& tsc --lib es7 init/listNormItem.ts \
&& tsc --lib es7 init/listNormLibrary.ts \
&& tsc --lib es7 init/listNormMatchRule.ts \
&& tsc --lib es7 init/listNormMaterial.ts \
&& tsc --lib es7 init/init.ts \
&& echo "=== init ===" \
&& sleep 2 \
&& SERVER_NAME="nest-component" SERVER_ENV="huyong" CONSUL_HOST="consul.xingfuli.me" CONSUL_PORT=8500 CONSUL_MASTER_TOKEN="12312345" node init/init.js

