const path = require('path')
const { merge } = require('webpack-merge')
const commonConfiguration = require('./webpack.common.js')
const ip = require('ip')
const portFinderSync = require('portfinder-sync')

const infoColor = (_message) =>
{
    return `\u001b[1m\u001b[34m${_message}\u001b[39m\u001b[22m`
}

const devNoCacheHeaders = (_res, filePath) =>
{
    if (/\.(html?|css|js|jpe?g|png|webp|glb|mp3|mp4)$/i.test(filePath))
    {
        _res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
        _res.setHeader('Pragma', 'no-cache')
    }
}

module.exports = merge(
    commonConfiguration,
    {
        stats: 'errors-warnings',
        mode: 'development',
        watchOptions: {
            ignored: [
                '**/node_modules/**',
                '**/.git/**',
                '**/.tools/**',
                '**/_reference/**',
                '**/portfolio-3d/public/**',
            ],
        },
        infrastructureLogging:
        {
            level: 'warn',
        },
        devServer:
        {
            host: 'localhost',
            port: portFinderSync.getPort(8082),
            open: false,
            https: false,
            allowedHosts: 'all',
            hot: false,
            watchFiles: ['src/**', 'static/**'],
            static: [
                {
                    watch: true,
                    directory: path.join(__dirname, '../static'),
                    staticOptions: {
                        setHeaders: devNoCacheHeaders,
                    },
                },
                {
                    watch: false,
                    directory: path.join(__dirname, '../..'),
                    publicPath: '/',
                    staticOptions: {
                        index: false,
                        setHeaders: devNoCacheHeaders,
                    },
                },
            ],
            client:
            {
                logging: 'none',
                overlay: true,
                progress: false
            },
            onAfterSetupMiddleware: function(devServer)
            {
                const port = devServer.options.port
                const https = devServer.options.https ? 's' : ''
                const domain2 = `http${https}://localhost:${port}`
                let domain1 = domain2
                try {
                    const localIp = ip.address()
                    if (localIp) {
                        domain1 = `http${https}://${localIp}:${port}`
                    }
                } catch (_err) {
                    // ip.address() can fail in restricted environments
                }

                console.log(`Project running at:\n  - ${infoColor(domain1)}\n  - ${infoColor(domain2)}`)
            }
        }
    }
)
