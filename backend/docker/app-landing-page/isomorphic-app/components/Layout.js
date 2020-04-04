/* eslint-disable react/react-in-jsx-scope */
import Head from 'next/head';

// Retrieve asset prefix, to make url work with nginx proxy_pass reverse-proxy
// url rewrite. see next.config.js.
// @warning must be updated in next.config.js as well for the generated /_next
//    directory.
const assetPrefix = process.env.USE_REVERSE_PROXIED_LINKS ? 'flux/' : '';

const Layout = ({ children }) =>
    <>
        <Head>
            <title>Flux - Prédiction de symptôme en santé mentale</title>
            <meta charSet="utf-8" />
            <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <meta name="description" content="Acquisition de données pour la prédiction de symptôme en santé mentale." />
            <meta name="author" content="PNPLab" />
            <link rel="shortcut icon" href={assetPrefix + 'favicon.ico'} />
            <link href="https://fonts.googleapis.com/css?family=Maven+Pro:400,500,700|Nunito:400,600,700" rel="stylesheet" />
            {/* <script defer src="https://use.fontawesome.com/releases/v5.7.2/js/all.js" integrity="sha384-0pzryjIRos8mFBWMzSSZApWtPl/5++eIfzYmTgBBmXYdhvxPc+XcFEk+zJwDgWbP" crossOrigin="anonymous"></script> */}
            {/* <link rel="stylesheet" href="plugins/jquery-flipster/dist/jquery.flipster.min.css" /> */}
            <link id="theme-style" rel="stylesheet" href={assetPrefix + 'css/theme.css'} />

            {/* prevent chrome from displaying a translate popup on top of download app popup */}
            <meta httpEquiv="content-language" content="fr" />
            <meta name="google" content="notranslate" />
        </Head>

        {/*
          * @warning We can't use <body> and dynamic attributes.
          * cf. https://spectrum.chat/next-js/general/setting-body-classname~081fd577-3797-43ff-99ab-eda5b66cdbbb
          * cf. https://gist.github.com/dmurawsky/d45f068097d181c733a53687edce1919
          *
          * @warning 100vh doesn't reduce it's size for android chrome url bar,
          *     100% does. Also, body minHeight doesn't work, must be height.
          *     cf. https://developers.google.com/web/updates/2016/12/url-bar-resizing
          */}
        <style global jsx>
            {`
                html, body {
                    height: 100%;
                }
                body, #__next {
                    display: flex;
                    flex-direction: column;
                    flex: 1;
                }
            `}
        </style>
        {children}
    </>;

export default Layout;
