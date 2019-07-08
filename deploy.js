/* eslint import/no-extraneous-dependencies: "off", no-console: "off" */
require('dotenv').config();
const NodeSsh = require('node-ssh');
const os = require('os');

const [CONFIG_TYPE, DEPLOYTYPE] = process.argv.slice(2);

const config = {
  default: {
    key: process.env.STAGE_SSH_KEY,
    dir: `${process.env.STAGE_PROJECTS_DIRECTORY}${process.env.PROJET_NAME}/project`,
    projectsDir: process.env.STAGE_PROJECTS_DIRECTORY,
    repository: process.env.GIT_REPOSITORY,
    initialRepository: process.env.GIT_INITIAL_REPOSITORY
  },
  stage: {
    server: {
      host: process.env.STAGE_HOST,
      user: process.env.STAGE_USER
    },
    branch: process.env.STAGE_GIT_BRANCH
  }
};

const remoteServer = new NodeSsh();

const connectServer = async confType => {
  await remoteServer.connect({
    host: config[confType].server.host,
    username: config[confType].server.user,
    privateKey: config.default.key.replace('~', os.homedir())
  });
  console.log(`connected ${config[confType].server.user}@${config[confType].server.host}`);
  return remoteServer.requestShell();
};

const createShell = async SSH2Shell => {
  let name = null;
  // wait fist invitation
  await new Promise((res) => {
    const checkInvitation = (data) => {
      const dataUtf8 = data.toString('utf8');
      if (dataUtf8.indexOf('#') !== -1) {
        [name] = dataUtf8.split(':');
        SSH2Shell.stdout.removeListener('data', checkInvitation);
        res();
      }
    };
    SSH2Shell.stdout.on('data', checkInvitation);
  });
  // return execution fnc
  return command => {
    SSH2Shell.stdin.write(`${command}\n`);
    return new Promise((res) => {
      const dataHandler = (data) => {
        const dataUtf8 = data.toString('utf8');
        if (dataUtf8 && dataUtf8 !== '\n') {
          console.log(`stdout: ${dataUtf8}`);
        }
        if (dataUtf8.indexOf('[Y/n]') !== -1) {
          SSH2Shell.stdin.write('Y\n');
        }
        if (dataUtf8.indexOf('#') !== -1 && dataUtf8.indexOf(name) !== -1) {
          SSH2Shell.stdout.removeListener('data', dataHandler);
          res();
        }
      };
      SSH2Shell.stdout.on('data', dataHandler);
    });
  };
};

const deploy = async confType => {
  const SSH2Shell = await connectServer(confType);
  const execShell = await createShell(SSH2Shell);

  await execShell(`cd ${config.default.dir}`);
  await execShell('git fetch');
  await execShell(`git pull ${config.default.repository} ${config[confType].branch}`);
  await execShell('npm i');

  await execShell('ls -la');
  remoteServer.dispose();
};

const deployForce = async confType => {
  const SSH2Shell = await connectServer(confType);
  const execShell = await createShell(SSH2Shell);
  await remoteServer.putDirectory('./public', `${config.default.dir}/public`);
  await execShell(`cd ${config.default.dir}`);
  await execShell('pm2 start http-server -- -p 80');
  remoteServer.dispose();
};

const deployInit = async confType => {
  const SSH2Shell = await connectServer(confType);
  const execShell = await createShell(SSH2Shell);
  const gitDependences = [
    'libcurl4-gnutls-dev',
    'libexpat1-dev',
    'gettext',
    'libc-ares2',
    'libhttp-parser2.7.1',
    'libuv1',
    'nodejs-doc'
  ];

  await execShell('apt-get update');
  // install git
  await execShell(`apt-get install ${gitDependences.join(' ')}`);
  await execShell('apt-get install git');
  await execShell('git --version');
  // install nvm
  await execShell(
    'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash'
  );
  await execShell('source ~/.bashrc');
  await execShell('nvm --version');
  await execShell('nvm install 12');
  await execShell('nvm use 12');
  // install pm2
  await execShell('npm install pm2 -g');
  // install npm-merge-driver for package-lock.json
  await execShell('npx npm-merge-driver install -g');
  // install http-server
  await execShell('npm install http-server -g');
  // setup project
  await execShell(`mkdir -p ${config.default.dir}`);
  await execShell(`cd ${config.default.dir}`);
  await execShell(`git clone ${config.default.repository} .`);
  await execShell('npm i');

  remoteServer.dispose();
};


switch (DEPLOYTYPE) {
case 'force':
  deployForce(CONFIG_TYPE);
  break;
case 'init':
  deployInit(CONFIG_TYPE);
  break;
default:
  deploy(CONFIG_TYPE);
}
