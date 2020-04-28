const program = require('commander');
const chalk = require('chalk');

program
  .option('-H, --host <host>', 'host')
  .option('-P, --port <port>', 'port')
  .option('-u, --username <username>', 'username')
  .option('-p, --password <password>', 'password')
  .option('-d, --debug', 'debug')
  .parse(process.argv);

if(!program.host) {
    console.error('missing host');
    return
}
if(!program.port) {
    console.error('missing port');
    return
}
if(!program.username) {
    console.error('missing username');
    return
}
if(!program.password) {
    console.error('missing password');
    return
}
ocs({
    host: program.host,
    port: program.port,
    username: program.username,
    password: program.password,
    debug: program.debug
})

function danger(err) {
    console.log(chalk.red(require('util').inspect(err)));
}

function interact(client, domain, dump) {
    return client
        .open()
        .then(() => {
            const help = () => {
                console.log(`${chalk.green('/h, help, ?')}\t show help`);
                console.log(
                    `${chalk.green('/q, quit, exit, close')}\t close connection`
                );
            };

            const readline = require('readline').createInterface({
                input: process.stdin,
                output: process.stdout
            });
            const query = input => {
                return client.exec(input).then(result => {
                    if (result != null) {
                        dump(result);
                    }
                });
            };

            const prompt = () => {
                readline.question(`${domain}>`, input => {
                    switch (input) {
                    case 'help':
                    case '?':
                    case '/h':
                        help();
                        prompt();
                        break;
                    case 'exit':
                    case 'quit':
                    case 'close':
                    case '/q':
                        readline.close();
                        client.close();
                        break;
                    default:
                        query(input)
                            .then(prompt)
                            .catch(err => {
                                console.log(
                                    chalk.red(require('util').inspect(err))
                                );
                                prompt();
                            });
                        break;
                    }
                });
            };

            help();
            prompt();
        })
        .catch(err => {
            danger(err);
            process.exit(1);
        });
}

function ocs(options) {
    if(options.debug) {
        process.env.DEBUG = '*';
    }
    const { createClient } = require('aliyun-sdk').MEMCACHED;

    const client = createClient(options.port, options.host, {
        username: options.username,
        password: options.password
    });

    const open = () => {
        return new Promise((resolve, reject) => {
            client.once('ready', resolve);
            client.once('error', reject);
        });
    };

    const exec = input => {
        return new Promise((resolve, reject) => {
            const [f, ...args] = input.split(/\s+/);
            client[f](...args, (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                }
            );
        });
    };

    const domian = `memcached@${options.host}:${options.port}`;

    if(program.args && program.args.length) {
        return open().then(() => exec(program.args.join(' '))).then(res => res != null && console.log(res)).then(() => client.end())
    }

    interact(
        {
            open,
            close: client.end.bind(client),
            exec
        },
        domian,
        console.log
    );
}