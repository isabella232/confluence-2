// Copyright 2017 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
'use strict';

//
// Run web service.
//
// See USAGE string for usage details.
//

const process = require('process');

global.FOAM_FLAGS = {gcloud: true};
require('foam2');

require('../lib/compat.es6.js');
require('../lib/confluence/api_count.es6.js');
require('../lib/confluence/browser_specific.es6.js');
require('../lib/confluence/lone_omission.es6.js');
require('../lib/confluence/lone_removal.es6.js');
require('../lib/dao/json_dao_container.es6.js');
require('../lib/data_source.es6.js');
require('../lib/parse/expressions.es6.js');
require('../lib/server/server.es6.js');
require('../lib/web_apis/api_compat_data.es6.js');
require('../lib/web_apis/release.es6.js');
require('../lib/web_apis/release_interface_relationship.es6.js');
require('../lib/web_apis/web_interface.es6.js');
const pkg = org.chromium.apis.web;

const USAGE = `USAGE:

    node /path/to/serve.js DataSource ServerMode

        DataSource = [ ${pkg.DataSource.VALUES
      .map((value) => value.name).join(' | ')} ]

        ServerMode = [ ${pkg.ServerMode.VALUES.map(
      (value) => value.name).join(' | ')} ]`;

if (process.argv.length !== 4) {
  console.error(USAGE);
  process.exit(1);
}

foam.CLASS({
  refines: 'foam.net.node.Handler',

  documentation: `Report raw message (no potentially identifying metadata) in
      request handlers`,

  methods: [
    function reportWarnMsg(req, msg) {
      this.warn(msg);
    },
    function reportErrorMsg(req, msg) {
      this.error(msg);
    },
  ],
});

function getModeString(Enum, str) {
  const mode = Enum.VALUES.find(function(value) {
    return value.name === str;
  });

  if (mode) return mode;

  console.error(`Invalid ${Enum.name}`);
  console.error(USAGE);

  process.exit(1);
  return null;
}

const containerMode = getModeString(pkg.DataSource, process.argv[2]);
const serverMode = getModeString(pkg.ServerMode, process.argv[3]);


const logger = foam.log.ConsoleLogger.create();

const basename = containerMode === pkg.DataSource.LOCAL ?
      `file://${__dirname}/../data/json` :
      require('../data/http_json_dao_base_url.json');

const compatClassFile = pkg.DAOContainer.COMPAT_MODEL_FILE_NAME;
const compatClassURL = `${basename}/${compatClassFile}`;
org.chromium.apis.web.ClassGenerator.create({
  classURL: compatClassURL,
}).generateClass().then(() => {
  const daoContainer = pkg.JsonDAOContainer.create({
    mode: containerMode,
    basename: basename,
  });
  const ctx = daoContainer.ctx;
  pkg.Server.create({
    mode: serverMode,
    port: 8080,
  }, ctx).start();
}, (err) => {
  logger.error(err);
  process.exit(1);
});
