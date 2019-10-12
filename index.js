#! /usr/bin/env node
var os = require('os');
const fs = require('fs');

const shell = require('shelljs');
const logSymbols = require('log-symbols');
const chalk = require('chalk');
const program = require('commander');
const download = require('download-git-repo');
const inquirer = require('inquirer');
const open = require('open');

var pageckage = require('./package');
// const handlebars = require('handlebars');

const ora = require('ora');
let spinner;

let questions = [
  {
    name: 'description',
    message: '请输入项目描述'
  },
  {
    name: 'author',
    message: '请输入作者名称'
  }
];

function printResult(msg, isSuccess = 1, needSpinner = 1) {
  if (isSuccess) {
    if (needSpinner) {
      spinner.succeed();
    }
    console.log(logSymbols.success, chalk.green(msg));
  } else {
    if (needSpinner) {
      spinner.fail();
    }
    console.log(logSymbols.error, chalk.red(msg));
  }
}

function printStart(msg) {
  spinner = ora(msg);
  spinner.start();
}

function initGitBook() {
  printStart('正在生成 GitBook 初始化文件。。。');
  shell.exec('gitbook init', { silent: true });
  printResult('GitBook 初始化文件生成成功');
}

function runGitBook() {
  printStart('正在启动 GitBook。。。');
  shell.exec('gitbook serve', { async: true }, function() {
    // 走不到回调函数。。。
  });
  printResult('GitBook 启动成功');
  setTimeout(() => {
    open('http://localhost:4000/');
  }, 3000);
}

function installGigBook() {
  printStart('正在全局安装 GitBook。。。');
  shell.exec('sudo npm i -g gitbook-cli', { silent: true });
  printResult('GitBook 安装成功');
}

function installGitbookPlugins() {
  printStart('正在安装 GitBook 插件。。。');
  shell.exec('gitbook install', { silent: true }, function(code) {
    if (code === 0) {
      printResult('GitBook 插件安装成功');
      initGitBook();
      runGitBook();
    } else {
      spinner.fail();
      printResult('GitBook 插件安装失败', 0);
    }
  });
}

function customProjectInfo() {}

function exit(code = 1) {
  shell.exit(code);
}

function install() {
  program
    .version(pageckage.version, '-v, --version')
    .command('init <name>')
    .action(name => {
      if (fs.existsSync(name)) {
        printResult('项目已存在', 0, 0);
        exit();
      }

      inquirer.prompt(questions).then(answers => {
        printStart('正在下载 easy-gitbook-template 模板...');
        download(
          'direct:https://github.com/wuqiang1985/gitbook-template.git',
          name,
          { clone: true },
          err => {
            if (!err) {
              //   spinner.succeed();
              printResult('easy-gitbook-template 下载成功');

              const meta = {
                name,
                description: answers.description,
                author: answers.author
              };

              const isGitBookInstalled = !!shell.which('gitbook');
              if (!isGitBookInstalled) {
                installGigBook();
              }

              shell.cd(name);

              installGitbookPlugins();
            } else {
              printResult('easy-gitbook-template 下载失败，请检查网络', 0);
            }
          }
        );
      });
    });

  program.parse(process.argv);
}

function init() {
  const isGitInstalled = !!shell.which('git');

  if (isGitInstalled) {
    install();
  } else {
    printResult('代码依赖git，请到https://git-scm.com/downloads下载和安装', 0);
    exit();
  }
}

init();
