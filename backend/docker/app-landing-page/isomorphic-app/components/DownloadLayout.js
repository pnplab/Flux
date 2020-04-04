/* eslint-disable react/react-in-jsx-scope */
import Layout from './Layout';

// Retrieve asset prefix, to make url work with nginx proxy_pass reverse-proxy
// url rewrite. see next.config.js.
// @warning must be updated in next.config.js as well for the generated /_next
//    directory.
const assetPrefix = process.env.USE_REVERSE_PROXIED_LINKS ? 'flux/' : '';

const DownloadLayout = ({ children }) =>
    <Layout>
        <header className="header">
            <div className="branding">
                <div className="container position-relative">
                    <nav className="navbar navbar-expand-lg" style={{ flex: 0, textAlign: 'center' }}>
                        <h1 className="site-logo">
                            <a className="navbar-brand" href="#">
                                <span className="logo-text">Flux</span> <img className="logo-icon" src={assetPrefix + 'images/logo-icon.svg'} style={{ visibility: 'hidden' }} alt="logo" />
                            </a>
                        </h1>
                    </nav>
                </div>
            </div>
        </header>

        {children}
    </Layout>;

export default DownloadLayout;
