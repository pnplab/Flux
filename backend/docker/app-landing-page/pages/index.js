const APK_DOWNLAOD_URL = 'https://github.com/pnplab/Flux/releases/download/v1.8.0/Flux.apk';

/* eslint-disable react/react-in-jsx-scope */

// Retrieve asset prefix, to make url work with nginx proxy_pass reverse-proxy
// url rewrite. see next.config.js.
const assetPrefix = process.env.ASSET_PREFIX;

const Index = () => (
    <html lang="en"> 
        <head>
            <title>Flux - Prédiction de symptôme en santé mentale</title>
            <meta charset="utf-8" />
            <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <meta name="description" content="Bootstrap 4 Mobile App Template" />
            <meta name="author" content="Xiaoying Riley at 3rd Wave Media" />
            <link rel="shortcut icon" href={assetPrefix + 'favicon.ico'} />
            <link href="https://fonts.googleapis.com/css?family=Maven+Pro:400,500,700|Nunito:400,600,700" rel="stylesheet" />
            {/* <script defer src="https://use.fontawesome.com/releases/v5.7.2/js/all.js" integrity="sha384-0pzryjIRos8mFBWMzSSZApWtPl/5++eIfzYmTgBBmXYdhvxPc+XcFEk+zJwDgWbP" crossOrigin="anonymous"></script> */}
            {/* <link rel="stylesheet" href="plugins/jquery-flipster/dist/jquery.flipster.min.css" /> */}
            <link id="theme-style" rel="stylesheet" href={assetPrefix + 'css/theme.css'} />
        </head>

        <body style={{backgroundColor: '#EFF2F5'}}>
            <header className="header" style={{backgroundColor: 'white'}}>
                <div className="branding">
                    <div className="container position-relative">
                        <nav className="navbar navbar-expand-lg" style={{flex: 0, textAlign: 'center'}}>
                            <h1 className="site-logo">
                                <a className="navbar-brand" href="#"><span className="logo-text">Flux</span> <img className="logo-icon" src={assetPrefix + 'images/logo-icon.svg'} style={{ visibility: 'hidden' }} alt="logo" /> </a>
                            </h1>
                        </nav>
                    </div>
                </div>
            </header>

            <section className="hero-section" style={{backgroundColor: 'white'}}>
                <div className="container">
                    <div className="row figure-holder">
                        <div className="col-12 col-md-6 pt-3 pt-md-4">
                            <h2 className="site-headline font-weight-bold mt-lg-5 pt-lg-5">Prédiction de symptôme en santé mentale</h2>
                            <div className="site-tagline mb-3">Flux est une application mobile de récolte de données longitudinales intensives réalisée en vue de prédire la sévérité des symptômes futurs chez des personnes souffrant de maladie mentale.</div>
                            <div className="cta-btns">
                                <ul className="app-stores list-unstyled list-inline mx-auto mx-md-0 d-inline-block">
                                    <li className="list-inline-item"><a href={APK_DOWNLAOD_URL}><img className="android" src={assetPrefix + 'images/appstore-browser-android.svg'} alt="google play" /></a></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </body>
    </html>
);

export default Index;
