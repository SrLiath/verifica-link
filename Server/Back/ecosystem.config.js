module.exports = {
  apps: [
    {
      name: 'index',
      script: './index.js',
      node_args: '--experimental-modules',
      watch: ['.'],
      ignore_watch: [
        'node_modules',
        'database.db',
        'database.db-journal',
        '*.db',
        '*.db-journal',
        '*.log'
      ],
      watch_options: {
        followSymlinks: false
      }
    }
  ]
}
