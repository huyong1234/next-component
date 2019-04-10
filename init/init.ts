/**
 * README:
 * build: tsc --lib es7 init/init.ts
 * SERVER_NAME="nest-component" SERVER_ENV="apooo" CONSUL_HOST="consul.xingfuli.me" CONSUL_PORT=8500 CONSUL_MASTER_TOKEN="12312345" node init/init.js
 */
// import version from "./version";
// import attributeMask from "./attributeMask";
// import attribute from "./attribute";
// import clientClass from "./clientClass";
// import classGroup from "./classGroup";
// import classVersion from "./classVersion";
// import attributeVersion from "./attributeVersion";
// import componentGroup from "./componentGroup";
// import texture from "./texture";

import listNormLibrary from "./listNormLibrary";
import listNormCatalog from "./listNormCatalog";
import listItem from "./listItem";
import listNormItem from "./listNormItem";
import listNormMaterial from "./listNormMaterial";
import listNormCalculateRule from "./listNormCalculateRule";
import listNormMatchRule from "./listNormMatchRule";


(async () => {
    // await version();
    // await attributeMask();
    // await attribute();
    // await clientClass();
    // await classGroup();
    // await classVersion();
    // await attributeVersion();
    // await componentGroup();
    // await texture();

    await listNormLibrary();
    await listNormCatalog();
    await listItem();
    await listNormItem();
    await listNormMaterial();
    await listNormCalculateRule();
    await listNormMatchRule();
})();
