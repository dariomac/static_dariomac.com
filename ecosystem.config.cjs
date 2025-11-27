module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps : [

    // First application
    {
      name      : 'dm.com',
      script    : 'server.mjs',
      watch     : true,
      exec_mode : "cluster",
      env: {

      },
      env_production : {
        NODE_ENV: 'production'
      }
    }
  ]
}
