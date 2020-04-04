/**
 * The Flux app download page with server-side and client rendering. The
 * download status is mapped through koa reverse-proxy w/ socketio binding.
 * cf. https://stackoverflow.com/questions/41334881/detect-when-user-accepts-to-download-a-file
 */
import { Component } from 'react';
import Layout from '../components/Layout';
import PrettyLayout from '../components/PrettyLayout';
import DownloadLayout from '../components/DownloadLayout';
import socketIo from 'socket.io-client';
import uuid from 'uuid';

// @warning I've seen it's more heavy to load css/less + components from global
//     import. instead of following:
// import Steps from 'antd-mobile/lib/steps';
// import WingBlank from 'antd-mobile/lib/wing-blank';
// import WhiteSpace from 'antd-mobile/lib/white-space';
// require('antd-mobile/lib/steps/style');
// require('antd-mobile/lib/wing-blank/style');
// require('antd-mobile/lib/white-space/style');
//
// Seems fine though according to
// cf. https://github.com/ant-design/babel-plugin-import#via-babelrc.
//
// @note
// The antd version has more complete control than the antd-mobile one,
// although the antd-mobile is both web and react-native compatible.
// We use the mobile version as the Step component is made for ongoing
// onboarding progress only while the standard one provides better control.
import { Steps } from 'antd';
// import { WingBlank } from 'antd';
// import { WhiteSpace } from 'antd';
const { Step } = Steps;


/* eslint-disable react/react-in-jsx-scope */

// Retrieve asset prefix, to make url work with nginx proxy_pass reverse-proxy
// url rewrite. see next.config.js.
// @warning must be updated in next.config.js as well for the generated /_next
//    directory.
const assetPrefix = process.env.USE_REVERSE_PROXIED_LINKS ? 'flux/' : '';

const ProgressBar = ({ percentage }) =>
    <div style={{
        backgroundColor: '#EEE',
        height: '0.33rem',
        marginTop: '0.33rem',
        marginLeft: 'auto',
        marginRight: 'auto',
        marginBottom: '1.33rem',
        width: '50%',
    }}>
        <div style={{
            display: 'inline-block',
            backgroundColor: '#111',
            height: '100%',
            width: percentage * 100 + '%',
            float: 'left'
        }} />
    </div>;

function toggleFullScreen() {
    var doc = window.document;
    var docEl = doc.documentElement;

    var requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
    var cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

    if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
        requestFullScreen.call(docEl);
    }
    else {
        cancelFullScreen.call(doc);
    }
};

class Index extends Component {
    constructor(props) {
        super(props);

        this.state = {
            downloadState: 'none', // 'none' | 'clicked' | 'ongoing' | 'failed' | 'succeeded' | 'install'
            downloadedPercentage: undefined, // [0, 1]
            currentInstallStep: 0
        };
    }

    // getInitialProps can get called both from client-side and server-side
    // (SSR).
    // @warning use isomorphic code only.
    static async getInitialProps(ctx) {
        // @warning nextjs rely on nodejs request/response and thus always
        //     convert HTTP headers to lower-case to cope with potential
        //     incompatible case.
        // @warning req.getHeader() (node) doesn't work nor req.header()
        //     (expressjs).

        // Checkout if we use links remapped by our nginx proxy from the
        // browser side.
        // @note reverse-proxy configured to forward traffic from / to /flux
        //     with current host request connection protocol/ip/port.
        const useReverseProxiedLinks = process.env.USE_REVERSE_PROXIED_LINKS;

        // Generate downloadId.
        let downloadId = uuid.v4();

        // Generate apk downloadLink.
        let downloadLink = null;
        // Client-side generated download link without reverse-proxy.
        if (process.browser && !useReverseProxiedLinks) {
            downloadLink = `${window.location.protocol}//${window.location.hostname}:3001/Flux.apk?downloadId=${downloadId}`;
        }
        // Server-side generated download link without reverse-proxy.
        else if (!process.browser && !useReverseProxiedLinks){
            downloadLink = `${ctx.req.connection.encrypted ? 'https' : 'http'}://${ctx.req.headers['host'].replace(3000, 3001)}/Flux.apk?downloadId=${downloadId}`;
        }
        // Client-side generated download link with reverse-proxy.
        else if (process.browser && useReverseProxiedLinks) {
            downloadLink = `${window.location.protocol}//${window.location.hostname}${window.location.port ? `:${window.location.port}` : ''}/flux/Flux.apk?downloadId=${downloadId}`;
        }
        // Server-side generated download link with reverse-proxy.
        else if (!process.browser && useReverseProxiedLinks) {
            downloadLink = `${ctx.req.connection.encrypted ? 'https' : 'http'}://${ctx.req.headers['host']}/flux/Flux.apk?downloadId=${downloadId}`;
        }
        // Better prevent than feel sorry.
        else {
            throw new Error('unexpected process.browser and reverse proxy setup for socketIoUrl prop generation.');
        }

        // Generate socketio link for browser-side real-time communication
        // concerning apk current download status.
        // @note although link can be generated server-side, client socketio
        //     connection will always be established browser-side (through the
        //     componentDidMount method).
        // @warning ssl over reverse-proxy implies ssl flag to be passed
        //     through in order for the backend to be able to generate the
        //     correct socketio url. For nginx. `proxy_set_header
        //     X-HTTPS-Protocol $ssl_protocol;`.
        //     cf. https://serverfault.com/questions/638097/passing-ssl-protocol-info-to-backend-via-http-header/638098.
        let socketIoUrl = null;
        let socketIoPath = null;
        // Client-side generated socketio link without reverse-proxy.
        if (process.browser && !useReverseProxiedLinks) {
            socketIoUrl = `${window.location.protocol}//${window.location.hostname}:3001/`;
            socketIoPath = '/socket.io'; // default socketio path.
        }
        // Server-side generated socketio link without reverse-proxy.
        else if (!process.browser && !useReverseProxiedLinks) {
            socketIoUrl = `${(ctx.req.connection.encrypted || ctx.req.connection.proxySecure || ctx.req.headers['x-forwarded-proto'] === 'https') ? 'https' : 'http'}://${ctx.req.headers['host'].replace(3000, 3001)}/`;
            socketIoPath = '/socket.io'; // default socketio path.
        }
        // Client-side generated socketio link with reverse-proxy.
        else if (process.browser && useReverseProxiedLinks) {
            socketIoUrl = `${window.location.protocol}//${window.location.hostname}${window.location.port ? `:${window.location.port}` : ''}/`;
            socketIoPath = '/flux/socket.io'; // proxied socketio path.
        }
        // Server-side generated socketio link with reverse-proxy.
        else if (!process.browser && useReverseProxiedLinks) {
            socketIoUrl = `${(ctx.req.connection.encrypted || ctx.req.connection.proxySecure || ctx.req.headers['x-forwarded-proto'] === 'https') ? 'https' : 'http'}://${ctx.req.headers['host']}/`;
            socketIoPath = '/flux/socket.io'; // proxied socketio path.
        }
        // Better prevent than feel sorry.
        else {
            throw new Error('unexpected process.browser and reverse proxy setup for socketIoUrl prop generation.');
        }

        // Retrieve android version (from browser or case-insensitive request headers user agent).
        let userAgent = process.browser ? window.navigator.userAgent : ctx.req.headers['user-agent'];
        let androidVersionMatch = userAgent.toLowerCase().match(/android\s([0-9\.]*)/i);
        let androidVersionString = androidVersionMatch && androidVersionMatch[1] || undefined;
        let androidVersion = androidVersionString && parseFloat(androidVersionString) || undefined;

        // Setup props.
        return {
            downloadId,
            downloadLink,
            socketIoUrl,
            socketIoPath,
            androidVersion
        };
    }

    // componentDidMount is only called client-side, not through SSR.
    // cf. https://github.com/zeit/next.js/issues/2473
    // @warning use browser code only.
    componentDidMount() {
        if (!process.browser) {
            throw new Error('This code should only be executed on the browser by design.');
        }

        // Establish socketio server connection.
        // @warning appending socketIoPath to socketIoUrl doesn't work as this
        //     is interpreted as a namespace path instead of a reverse proxy
        //     one by socketio.
        // @warning times out on android w/ development server.
        //     might be related to https://github.com/socketio/socket.io/issues/2769#issuecomment-530365777.
        this.socket = socketIo(this.props.socketIoUrl, {
            path: this.props.socketIoPath
        });

        // Ask server to forward download events related to the downloadId to
        // this specific socket.
        this.socket.emit('download.listen', { downloadId: this.props.downloadId });

        // Listen to change in the apk download status.
        // @note Event are queued by server until socketio connection is
        //     established if needed.
        this.socket.on('download.started', data => {
            console.info('download.started', data.fileMOSize);
            this.setState({
                downloadState: 'ongoing',
                downloadedPercentage: 0
            });
        });
        this.socket.on('download.chunkReceived', data => {
            this.setState({
                downloadState: 'ongoing',
                downloadedPercentage: data.downloadedPercentage
            });
        });
        this.socket.on('download.succeeded', data => {
            console.info('download.succeeded');
            this.setState({
                downloadState: 'succeeded',
            });
        });
        this.socket.on('download.failed', data => {
            console.info('download.failed', data.error);
            this.setState({
                downloadState: 'failed'
            });
        });
        this.socket.on('disconnect', () => {
            this.socket = null;
            this.setState(prevState => ({
                // When socketio gets disconnected during download, set
                // download state to failed. Indeed, we do not know if download
                // is stillongoing or not (likely not).
                downloadState: prevState.downloadState === 'succeeded' ? 'succeeded' :
                    prevState.downloadState === 'install' ? 'install' :
                        prevState.downloadState === 'none' ? 'none' :
                            'failed'
            }));
        });
    }

    componentWillUnmount() {
        // Explicitely disconnect on component unmount (not doing so might lead
        // to bug due to duplicate downloadId being used in server, although it
        // should not in our current use case).
        if (this.socket) {
            this.socket.disconnect();
        }
    }

    render() {
        switch (this.state.downloadState) {
        case 'none':
            /*
                * @note figure-holder contains img w/ source to
                *     `../images/hero-figure.png` + padding.
                */
            return (
                <PrettyLayout>
                    {/*
                    <h2 className="site-headline font-weight-bold mt-lg-5 pt-lg-5">
                        Prédiction de symptômes en santé mentale
                    </h2>
                    */}
                    <div className="site-tagline mb-3">
                        Une application mobile de récolte
                        de données pour prédire les
                        symptômes en santé mentale
                    </div>
                    <div className="cta-btns" style={{ marginTop: '4rem' }}>
                        <ul className="app-stores list-unstyled list-inline mx-auto mx-md-0 d-inline-block">
                            <li className="list-inline-item">
                                {
                                    /*
                                    * prevent double click on download link.
                                    * @note onClick -> change on href attribute prevents the download, thus
                                    *     the setTimeout.
                                    */
                                }
                                <a
                                    onClick={
                                        evt => window.setTimeout(
                                            () => {
                                                this.setState({ downloadState: 'clicked' });
                                                // @warning from memory toggleFullScreen must be called
                                                // from user interaction. -- not sure about this anymore.
                                                // toggleFullScreen();
                                            }
                                        )
                                    }
                                    href={this.state.downloadState === 'clicked' ? undefined : this.props.downloadLink}
                                    download
                                >
                                    <img className="android" src={assetPrefix + 'images/appstore-browser-android.svg'} alt="télécharger" />
                                </a>
                            </li>
                        </ul>
                    </div>
                    <div style={{ fontStyle: 'italic' }}>Accordez les autorisations si requises</div>
                </PrettyLayout>
            );
        case 'clicked':
            // Prevent the user to click twice on download button while waiting
            // for socketio response from download proxy. We can't yet display
            // the 'ongoing' interface as download dialogs aren't yet shown to
            // the user.
            return (
                <DownloadLayout></DownloadLayout>
            );
        case 'ongoing':
            return (
                <DownloadLayout>
                    {/*
                    Si un dialogue "File may harm your computer"
                    s'affiche, appuyez sur OK.
                    Si un dialogue "Download again" s'affiche,
                    appuyez sur DOWNLOAD.
                    android version: {this.props.androidVersion}
                    */}
                    <div style={{ flexDirection: 'column', flex: 1, display: 'flex', padding: '1rem', textAlign: 'center'}}>
                        <div className="site-tagline mb-3">
                            Acceptez les demandes
                        </div>
                        <div style={{ fontStyle: 'italic' }}>Ignorez le message d'alerte, cette application n'endommagera pas votre téléphone</div>
                        {/* cf. https://stackoverflow.com/a/33856609/939741 for why margin auto with flexbox */}
                        <div style={{ marginTop: 'auto', marginBottom: '3rem' }}>
                            <div>En cours de téléchargement.</div>
                            <ProgressBar percentage={this.state.downloadedPercentage} />
                        </div>
                    </div>
                </DownloadLayout>
            );
        case 'succeeded':
            return (
                <DownloadLayout>
                    <div style={{ flexDirection: 'column', flex: 1, display: 'flex', padding: '1rem', textAlign: 'center' }}>
                        <div className="site-tagline mb-3">
                            Acceptez les demandes
                        </div>
                        <div style={{ fontStyle: 'italic' }}>N'ouvrez pas l'application avant de lire les instructions</div>
                        {/* cf. https://stackoverflow.com/a/33856609/939741 for why margin auto with flexbox */}
                        <div style={{ marginTop: 'auto', marginBottom: '3rem' }}>
                            <div className="cta-btns">
                                <ul className="app-stores list-unstyled list-inline mx-auto mx-md-0 d-inline-block">
                                    <li className="list-inline-item">
                                        <a onClick={() => this.setState({ downloadState: 'install', currentInstallStep: 0 })}>
                                            <img style={{ height: 45 }} className="android" src={assetPrefix + 'images/android-instructions-button.svg'} alt="installer" />
                                        </a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </DownloadLayout>
            );
        case 'install':
            return (
                <DownloadLayout>
                    <div style={{ flexDirection: 'column', flex: 1, display: 'flex', padding: '1rem', textAlign: 'center' }}>
                        {/*
                        https://github.com/zeit/next.js/issues/5180
                        https://www.yuque.com/steven-kkr5g/aza/ig3x9w
                        */}
                        <style jsx global>{`
                            /* Realign small-sized steps' icons. */
                            /* no longer needed since using standard antd instead of antd-mobile.
                            .am-steps-label-vertical .am-steps-item-icon {
                                margin-left: 40px !important; /* 40px instead of 36px */
                            }
                            */
                        `}</style>
                        <div className="site-tagline mb-3">
                            Lisez les instructions suivantes avant d'installer l'application
                        </div>
                        <div style={{ padding: '1rem' }}>
                            {/*
                            @note We ignore finish state are this is an
                                installation process documentation rather than
                                a progressive onboarding UI. It's therefore
                                passive and holds no state of completion.

                                description={'Démarrez l\'installation de l\'application'}
                                description={'Autorisez l\'installation de l\'application'}
                                description={'Installez l\'application'}
                                description={'Lancez l\'application'}
                                description={'Je suis prêt'}
                            <Steps current={this.state.currentInstallStep} direction="horizontal" size="small" onChange={currentStep => this.setState({ currentInstallStep: currentStep}) }>
                                <Step status={this.state.currentInstallStep === 0 ? 'process' : 'wait'} title={'Démarrage'}/>
                                <Step status={this.state.currentInstallStep === 1 ? 'process' : 'wait'} title={'Autorisation'}/>
                                <Step status={this.state.currentInstallStep === 2 ? 'process' : 'wait'} title={'Installation'}/>
                                <Step status={this.state.currentInstallStep === 3 ? 'process' : 'wait'} title={'Lancement'}/>
                                <Step status={this.state.currentInstallStep === 4 ? 'process' : 'wait'} title={'Prêt'}/>
                            </Steps>
                            */}
                            {/* Leave space so download dialog doesn't cover our images/text. */}
                            {/*
                            <div style={{ marginBottom: '4rem', textAlign: 'center' }}>
                                {this.state.currentInstallStep === 0 &&
                                    <div>
                                        <img src={assetPrefix + 'images/flux-lt8-install-screen.png'} alt="boutton d'autorisation de l'installation d'application par chrome" style={{ maxWidth: '70%' , display: 'inline-block'}} />
                                        <img src={assetPrefix + 'images/flux-lt8-install-request-dialog.png'} alt="autorisation de l'installation d'application par chrome" style={{ maxWidth: '70%' , display: 'inline-block'}} />
                                    </div>
                                }
                                {this.state.currentInstallStep === 1 &&
                                    <div>
                                        <img src={assetPrefix + 'images/flux-lt8-install-request-settings-screen.png'} alt="boutton d'autorisation de l'installation d'application par chrome" style={{maxWidth: '70%', display: 'inline-block'}} />
                                        <img src={assetPrefix + 'images/flux-lt8-install-request-settings-warning-dialog.png'} alt="autorisation de l'installation d'application par chrome" style={{ maxWidth: '70%' , display: 'inline-block'}} />
                                    </div>
                                }
                                {this.state.currentInstallStep === 2 &&
                                    <div>
                                        <img src={assetPrefix + 'images/flux-lt8-install-screen.png'} alt="boutton d'autorisation de l'installation d'application par chrome" style={{ maxWidth: '70%' , display: 'inline-block'}} />
                                        <img src={assetPrefix + 'images/flux-lt8-install-request-settings-warning-dialog.png'} alt="autorisation de l'installation d'application par chrome" style={{ maxWidth: '70%' , display: 'inline-block'}} />
                                    </div>
                                }
                                {this.state.currentInstallStep === 3 &&
                                    <div>
                                        <img src={assetPrefix + 'images/flux-lt8-install-finished-screen.png'} alt="autorisation de l'installation d'application par chrome" style={{ maxWidth: '70%' , display: 'inline-block'}} />
                                    </div>
                                }
                                {this.state.currentInstallStep === 4 &&
                                    <div style={{ flexDirection: 'column', flex: 1, display: 'flex', padding: '1rem', textAlign: 'center' }}>
                                        Ouvrez l'application en cliquant sur le bouton qui s'affiche en bas.
                                    </div>
                                }
                            </div>
                            */}
                            <div style={{ fontStyle: 'italic', marginBottom: '1rem' }}>
                                Il se peut qu'android vous demande d'octroyer des
                                permissions pour installer Flux depuis une source
                                inconnue. Vous trouverez le paramètre tel
                                qu'affiché sur la capture suivante.
                            </div>

                            {this.props.androidVersion < 8
                            &&
                                <img src={assetPrefix + 'images/flux-lt8-install-request-settings-screen.png'} alt="boutton d'autorisation de l'installation d'application par chrome" style={{ maxWidth: '70%', display: 'inline-block' }} />
                            ||
                                <img src={assetPrefix + 'images/flux-8plus-allow-chrome-unknown-sources.png'} alt="boutton d'autorisation de l'installation d'application par chrome" style={{ maxWidth: '70%', display: 'inline-block' }} />
                            }


                            <div style={{ fontStyle: 'italic', marginTop: '1rem', marginBottom: '1rem' }}>
                                Vous devrez alors revenir en arrière en
                                utilisant le bouton de votre téléphone.
                            </div>

                            <img src={assetPrefix + 'images/android-goback-button.jpg'} alt="boutton d'autorisation de l'installation d'application par chrome" style={{ maxWidth: '70%', display: 'inline-block' }} />

                            <div style={{ fontStyle: 'italic', marginTop: '1rem', marginBottom: '3rem' }}>
                                Vous pouvez désormais installer Flux en
                                ouvrant le fichier télécharger (remontez la
                                page pour que le dialogue d'ouverture
                                s'affiche).
                            </div>
                        </div>
                    </div>
                </DownloadLayout>
            );
        case 'failed':
            return (
                <PrettyLayout>
                    <ProgressBar percentage={this.state.downloadedPercentage} />
                    <div className="site-tagline mb-3">
                        Le téléchargement a échoué. Veuillez le
                        relancer en cliquant de nouveau sur le
                        bouton de téléchargement.
                    </div>
                    <div className="cta-btns">
                        <ul className="app-stores list-unstyled list-inline mx-auto mx-md-0 d-inline-block">
                            <li className="list-inline-item">
                                {
                                    /*
                                        * prevent double click on download link.
                                        * @note onClick -> change on href attribute prevents the download, thus
                                        *     the setTimeout.
                                        */
                                }
                                <a
                                    onClick={
                                        evt => window.setTimeout(
                                            () => {
                                                this.setState({ downloadState: 'clicked' });
                                                // @warning from memory toggleFullScreen must be called
                                                // from user interaction. -- not sure about this anymore.
                                                // toggleFullScreen();
                                            }
                                        )
                                    }
                                    href={this.state.downloadState === 'clicked' ? undefined : this.props.downloadLink}
                                    download
                                >
                                    <img className="android" src={assetPrefix + 'images/appstore-browser-android.svg'} alt="télécharger" />
                                </a>
                            </li>
                        </ul>
                    </div>
                </PrettyLayout>
            );
        }
    }
}

export default Index;
