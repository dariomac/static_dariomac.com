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
  ],

  /**
   * Deployment section
   * http://pm2.keymetrics.io/docs/usage/deployment/
   */
  deploy : {
    production : {
      user : 'node',
      host : '212.83.163.1',
      ref  : 'origin/master',
      repo : 'git@github.com:repo.git',
      path : '/var/www/production',
      'post-deploy' : 'npm install && pm2 reload ecosystem.config.cjs --env production'
    },
    dev : {
      key  : '/home/dmacchi/.ssh/id_rsa_dm.com.pub',
      user : 'dmacchi',
      host : 'bitbucket.org',
      ref  : 'origin/master',
      repo : 'git@bitbucket.org:dariomac/static_dariomac.com.git',
      path : '.',
      'post-deploy' : 'yarn install && pm2 reload ecosystem.config.cjs --env dev',
      env  : {
        NODE_ENV: 'dev'
      }
    }
  }
}
