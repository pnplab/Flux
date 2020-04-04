/* eslint-disable react/react-in-jsx-scope */
import Layout from './Layout';

// Retrieve asset prefix, to make url work with nginx proxy_pass reverse-proxy
// url rewrite. see next.config.js.
// @warning must be updated in next.config.js as well for the generated /_next
//    directory.
const assetPrefix = process.env.USE_REVERSE_PROXIED_LINKS ? 'flux/' : '';

const PrettyLayout = ({ children }) =>
    <Layout>
        <div style={{ backgroundColor: '#EFF2F5', minHeight: '100%' }}>
            <header className="header" style={{ backgroundColor: 'white' }}>
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

            <section className="hero-section" style={{ backgroundColor: 'white' }}>
                <div className="container">
                    <div className={'row figure-holder'}>
                        <div className={'col-12 pt-3 pt-md-4 col-md-6'}>
                            {children}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    </Layout>;

export default PrettyLayout;
