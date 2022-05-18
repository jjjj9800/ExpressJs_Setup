#!/usr/bin/env node
const inquirer = require("inquirer");
const path = require('path');
const { spawn } = require('child_process');
const util = require('util');
const {writeFile, readFile} = require("fs").promises;

(async () => {
    const {database, graphQL, grpc, webSocket, autoInstallAndUpdate} = await inquirer.prompt([
        {
            type: "list",
            message: "Pick Database",
            name: "database",
            choices: ['mysql', 'pgsql', "mariadb", "sqlite3"],
            default: "pgsql"
        },
        {
            type: "list",
            message: "Select GraphQL",
            name: "graphQL",
            choices: ['none', 'graphql', "apollo-server-express"],
            default: "none"
        },
        {
            type: "confirm",
            message: "import gRPC  (default: N)",
            name: "grpc",
            default: false
        },
        {
            type: "confirm",
            message: "import Socket.IO  (default: N)",
            name: "webSocket",
            default: false
        },
        {
            type: "confirm",
            message: "Auto run NPM Install and Update (default: N)",
            name: "autoInstallAndUpdate",
            default: false
        }
    ]);

    const packagePath = path.join(process.cwd(), 'package.json');
    let packageJsonString = await readFile(packagePath).catch(console.log);
    let packageData = JSON.parse(packageJsonString.toString());

    if (!packageData.devDependencies)
        packageData.devDependencies = {};
    if (!packageData.dependencies)
        packageData.dependencies = {};

    Object.assign(packageData.devDependencies, {
        "@types/express": "^4.17.13",
        "@types/node": "^16.11.10",
        "@types/bcryptjs": "^2.4.2",
        "@types/cookie-parser": "^1.4.2",
        "@types/express-session": "^1.17.4",
        "@types/jsonwebtoken": "^8.5.8",
        "ts-node": "10.7.0",
        "ts-node-dev": "^1.1.8",
        typescript: "4.5.2",
    });

    Object.assign(packageData.dependencies, {
        "bcryptjs": "^2.4.3",
        "body-parser": "^1.20.0",
        "cookie-parser": "^1.4.6",
        "cors": "^2.8.5",
        "dotenv": "^16.0.0",
        "express": "^4.18.1",
        "express-session": "^1.17.2",
        typeorm: "0.3.6",
        "jsonwebtoken": "^8.5.1",
        "reflect-metadata": "^0.1.13",
        "moment": "^2.29.3",
        "nodemon": "^2.0.15",
    });

    switch (database) {
        case "mysql":
        case "mariadb":
            packageData.dependencies['mysql'] = "^2.14.1";
            break;
        case "pgsql":
            packageData.dependencies["pg"] = "^8.4.0";
            break;
        case "sqlite3":
            packageData.dependencies["sqlite3"] = "^4.0.3";
            break;
    }

    switch (graphQL) {
        case "graphql":
            packageData.dependencies['graphql'] = "^15.3.0";
            break;
        case "apollo-server-express":
            packageData.dependencies['graphql'] = "^15.3.0";
            packageData.dependencies['apollo-server-express'] = "^3.6.6";
            break;
    }

    if (grpc) {
        packageData.dependencies['@grpc/grpc-js'] = "^1.5.7";
        packageData.dependencies['grpc'] = "^1.24.11";
        packageData.dependencies['grpc-tools'] = "^1.11.2";
        packageData.dependencies['grpc_tools_node_protoc_ts'] = "^5.3.2";
        packageData.dependencies['protobufjs'] = "^6.11.2";
    }

    if (webSocket) {
        packageData.dependencies['socket.io'] = "^4.5.0";
    }

    const saveData = JSON.stringify(packageData, null, 2);

    await writeFile(packagePath, saveData.toString()).catch(err => {
        console.log(err);
        process.exit();
    });

    if (autoInstallAndUpdate) {

        function mySpawn(command, args, options, cb) {
            const child = spawn(command, args, options);
            child.on('close', (exitCode) => { cb(null, exitCode) });
            return child;
        }

        const mySpawnPromisified = util.promisify(mySpawn);

        mySpawnPromisified("npm", ["install"], { stdio: "inherit" }).then(function() {
            mySpawnPromisified("npm", ["update"], { stdio: "inherit" }).then(function() {
                console.log(`package update finish`)
            });
        });
    }
})()
