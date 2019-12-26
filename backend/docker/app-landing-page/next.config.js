// Make next.js url of assets work with nginx proxy_pass reverse-proxy url
// rewrite.
// @warning Links, imgs etc. must still be prefixed manually with
// process.env.ASSET_PREFIX.
//
// cf. https://github.com/zeit/next.js/issues/4998#issuecomment-522799339

const assetPrefix = 'flux/';

module.exports = {
    assetPrefix,
    env: {
        ASSET_PREFIX: assetPrefix,
    }
};

