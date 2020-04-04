// Make next.js url of assets work with nginx proxy_pass reverse-proxy url
// rewrite.
// @warning Links, imgs etc. must still be prefixed manually with
// process.env.ASSET_PREFIX.
//
// cf. https://github.com/zeit/next.js/issues/4998#issuecomment-522799339

const useReverseProxiedLinks = typeof process.env.USE_REVERSE_PROXIED_LINKS === 'undefined' ? false : !!process.env.USE_REVERSE_PROXIED_LINKS;
console.info('process.env.USE_REVERSE_PROXIED_LINKS', process.env.USE_REVERSE_PROXIED_LINKS);

const nextjsEnvConfig = {
    // Prefix /_next generated directory path.
    // @warning must be updated in source code as well for our own URLs.
    assetPrefix: useReverseProxiedLinks ? '/flux' : undefined,
    // Share env config to browser-side.
    env: {
        USE_REVERSE_PROXIED_LINKS: useReverseProxiedLinks
    }
};



// Inject antd component framework less/css loader.
// cf. https://github.com/sdli/next-antd-aza-less -> didn't work
// cf. https://github.com/zeit/next.js/blob/canary/examples/with-ant-design-less/next.config.js
// ref. https://github.com/zeit/next.js/pull/6989, https://github.com/zeit/next.js/pull/7490/files,
//     https://github.com/zeit/next.js/issues/484, and
//     https://github.com/ant-design/antd-mobile-samples/blob/master/web-ssr/next.config.js (last one
//     relies on <link rel='stylesheet' type='text/css' href='//unpkg.com/antd-mobile@2.3.1/dist/antd-mobile.min.css' />)

/* eslint-disable */
const withLess = require('@zeit/next-less')
const withCSS = require('@zeit/next-css')
const lessToJS = require('less-vars-to-js')
const fs = require('fs')
const path = require('path')

// Where your antd-custom.less file lives
// const themeVariables = lessToJS(
//    fs.readFileSync(path.resolve(__dirname, './assets/antd-custom.less'), 'utf8')
// )

const themeVariables = {};

const nextjsAntdConfig = {
    lessLoaderOptions: {
        javascriptEnabled: true,
        modifyVars: themeVariables, // make your antd custom effective
    },
    webpack: (config, { isServer }) => {
        if (isServer) {
            const antStyles = /antd\/.*?\/style.*?/
            const origExternals = [...config.externals]
            config.externals = [
                (context, request, callback) => {
                    if (request.match(antStyles)) return callback()
                    if (typeof origExternals[0] === 'function') {
                        origExternals[0](context, request, callback)
                    } else {
                        callback()
                    }
                },
                ...(typeof origExternals[0] === 'function' ? [] : origExternals),
            ]

            config.module.rules.unshift({
                test: antStyles,
                use: 'null-loader',
            })
        }
        return config;
    },
};

module.exports = withLess(Object.assign({}, nextjsAntdConfig, nextjsEnvConfig));

// Fixes the following undocummented issue happening through antd-mobile
// component.
//
// ```
// ./node_modules/normalize.css / normalize.css 12: 5
// Module parse failed: Unexpected token(12: 5)
// You may need an appropriate loader to handle this file type, currently no loaders are configured to process this file.See https://webpack.js.org/concepts#loaders
// ```
module.exports = withCSS(module.exports);