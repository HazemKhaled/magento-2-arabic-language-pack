/* This file is used to set order of execution of integration test files */
// require("../integration/services/getstore.spec.ts")
// require("../integration/services/authentication.service.spec.ts")
// require("../integration/services/stores.service.spec.ts")
// require("../integration/services/categories.service.spec.ts")

import '../integration/services/getstore.spec.ts';
import '../integration/services/categories.service.spec.ts';
import '../integration/services/authentication.service.spec.ts';