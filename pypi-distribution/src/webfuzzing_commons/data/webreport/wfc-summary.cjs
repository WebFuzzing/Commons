"use strict";
const node_fs = require("node:fs");
const node_path = require("node:path");
const node_util = require("node:util");
var util;
(function(util2) {
  util2.assertEqual = (_) => {
  };
  function assertIs(_arg) {
  }
  util2.assertIs = assertIs;
  function assertNever(_x) {
    throw new Error();
  }
  util2.assertNever = assertNever;
  util2.arrayToEnum = (items) => {
    const obj = {};
    for (const item of items) {
      obj[item] = item;
    }
    return obj;
  };
  util2.getValidEnumValues = (obj) => {
    const validKeys = util2.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
    const filtered = {};
    for (const k of validKeys) {
      filtered[k] = obj[k];
    }
    return util2.objectValues(filtered);
  };
  util2.objectValues = (obj) => {
    return util2.objectKeys(obj).map(function(e) {
      return obj[e];
    });
  };
  util2.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
    const keys = [];
    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        keys.push(key);
      }
    }
    return keys;
  };
  util2.find = (arr, checker) => {
    for (const item of arr) {
      if (checker(item))
        return item;
    }
    return void 0;
  };
  util2.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
  function joinValues(array, separator = " | ") {
    return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
  }
  util2.joinValues = joinValues;
  util2.jsonStringifyReplacer = (_, value) => {
    if (typeof value === "bigint") {
      return value.toString();
    }
    return value;
  };
})(util || (util = {}));
var objectUtil;
(function(objectUtil2) {
  objectUtil2.mergeShapes = (first, second) => {
    return {
      ...first,
      ...second
      // second overwrites first
    };
  };
})(objectUtil || (objectUtil = {}));
const ZodParsedType = util.arrayToEnum([
  "string",
  "nan",
  "number",
  "integer",
  "float",
  "boolean",
  "date",
  "bigint",
  "symbol",
  "function",
  "undefined",
  "null",
  "array",
  "object",
  "unknown",
  "promise",
  "void",
  "never",
  "map",
  "set"
]);
const getParsedType = (data) => {
  const t = typeof data;
  switch (t) {
    case "undefined":
      return ZodParsedType.undefined;
    case "string":
      return ZodParsedType.string;
    case "number":
      return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
    case "boolean":
      return ZodParsedType.boolean;
    case "function":
      return ZodParsedType.function;
    case "bigint":
      return ZodParsedType.bigint;
    case "symbol":
      return ZodParsedType.symbol;
    case "object":
      if (Array.isArray(data)) {
        return ZodParsedType.array;
      }
      if (data === null) {
        return ZodParsedType.null;
      }
      if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
        return ZodParsedType.promise;
      }
      if (typeof Map !== "undefined" && data instanceof Map) {
        return ZodParsedType.map;
      }
      if (typeof Set !== "undefined" && data instanceof Set) {
        return ZodParsedType.set;
      }
      if (typeof Date !== "undefined" && data instanceof Date) {
        return ZodParsedType.date;
      }
      return ZodParsedType.object;
    default:
      return ZodParsedType.unknown;
  }
};
const ZodIssueCode = util.arrayToEnum([
  "invalid_type",
  "invalid_literal",
  "custom",
  "invalid_union",
  "invalid_union_discriminator",
  "invalid_enum_value",
  "unrecognized_keys",
  "invalid_arguments",
  "invalid_return_type",
  "invalid_date",
  "invalid_string",
  "too_small",
  "too_big",
  "invalid_intersection_types",
  "not_multiple_of",
  "not_finite"
]);
class ZodError extends Error {
  get errors() {
    return this.issues;
  }
  constructor(issues) {
    super();
    this.issues = [];
    this.addIssue = (sub) => {
      this.issues = [...this.issues, sub];
    };
    this.addIssues = (subs = []) => {
      this.issues = [...this.issues, ...subs];
    };
    const actualProto = new.target.prototype;
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, actualProto);
    } else {
      this.__proto__ = actualProto;
    }
    this.name = "ZodError";
    this.issues = issues;
  }
  format(_mapper) {
    const mapper = _mapper || function(issue) {
      return issue.message;
    };
    const fieldErrors = { _errors: [] };
    const processError = (error) => {
      for (const issue of error.issues) {
        if (issue.code === "invalid_union") {
          issue.unionErrors.map(processError);
        } else if (issue.code === "invalid_return_type") {
          processError(issue.returnTypeError);
        } else if (issue.code === "invalid_arguments") {
          processError(issue.argumentsError);
        } else if (issue.path.length === 0) {
          fieldErrors._errors.push(mapper(issue));
        } else {
          let curr = fieldErrors;
          let i = 0;
          while (i < issue.path.length) {
            const el = issue.path[i];
            const terminal = i === issue.path.length - 1;
            if (!terminal) {
              curr[el] = curr[el] || { _errors: [] };
            } else {
              curr[el] = curr[el] || { _errors: [] };
              curr[el]._errors.push(mapper(issue));
            }
            curr = curr[el];
            i++;
          }
        }
      }
    };
    processError(this);
    return fieldErrors;
  }
  static assert(value) {
    if (!(value instanceof ZodError)) {
      throw new Error(`Not a ZodError: ${value}`);
    }
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
  }
  get isEmpty() {
    return this.issues.length === 0;
  }
  flatten(mapper = (issue) => issue.message) {
    const fieldErrors = {};
    const formErrors = [];
    for (const sub of this.issues) {
      if (sub.path.length > 0) {
        const firstEl = sub.path[0];
        fieldErrors[firstEl] = fieldErrors[firstEl] || [];
        fieldErrors[firstEl].push(mapper(sub));
      } else {
        formErrors.push(mapper(sub));
      }
    }
    return { formErrors, fieldErrors };
  }
  get formErrors() {
    return this.flatten();
  }
}
ZodError.create = (issues) => {
  const error = new ZodError(issues);
  return error;
};
const errorMap = (issue, _ctx) => {
  let message;
  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === ZodParsedType.undefined) {
        message = "Required";
      } else {
        message = `Expected ${issue.expected}, received ${issue.received}`;
      }
      break;
    case ZodIssueCode.invalid_literal:
      message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
      break;
    case ZodIssueCode.unrecognized_keys:
      message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
      break;
    case ZodIssueCode.invalid_union:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_union_discriminator:
      message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
      break;
    case ZodIssueCode.invalid_enum_value:
      message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
      break;
    case ZodIssueCode.invalid_arguments:
      message = `Invalid function arguments`;
      break;
    case ZodIssueCode.invalid_return_type:
      message = `Invalid function return type`;
      break;
    case ZodIssueCode.invalid_date:
      message = `Invalid date`;
      break;
    case ZodIssueCode.invalid_string:
      if (typeof issue.validation === "object") {
        if ("includes" in issue.validation) {
          message = `Invalid input: must include "${issue.validation.includes}"`;
          if (typeof issue.validation.position === "number") {
            message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
          }
        } else if ("startsWith" in issue.validation) {
          message = `Invalid input: must start with "${issue.validation.startsWith}"`;
        } else if ("endsWith" in issue.validation) {
          message = `Invalid input: must end with "${issue.validation.endsWith}"`;
        } else {
          util.assertNever(issue.validation);
        }
      } else if (issue.validation !== "regex") {
        message = `Invalid ${issue.validation}`;
      } else {
        message = "Invalid";
      }
      break;
    case ZodIssueCode.too_small:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "bigint")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.too_big:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "bigint")
        message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.custom:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_intersection_types:
      message = `Intersection results could not be merged`;
      break;
    case ZodIssueCode.not_multiple_of:
      message = `Number must be a multiple of ${issue.multipleOf}`;
      break;
    case ZodIssueCode.not_finite:
      message = "Number must be finite";
      break;
    default:
      message = _ctx.defaultError;
      util.assertNever(issue);
  }
  return { message };
};
let overrideErrorMap = errorMap;
function getErrorMap() {
  return overrideErrorMap;
}
const makeIssue = (params) => {
  const { data, path, errorMaps, issueData } = params;
  const fullPath = [...path, ...issueData.path || []];
  const fullIssue = {
    ...issueData,
    path: fullPath
  };
  if (issueData.message !== void 0) {
    return {
      ...issueData,
      path: fullPath,
      message: issueData.message
    };
  }
  let errorMessage2 = "";
  const maps = errorMaps.filter((m) => !!m).slice().reverse();
  for (const map of maps) {
    errorMessage2 = map(fullIssue, { data, defaultError: errorMessage2 }).message;
  }
  return {
    ...issueData,
    path: fullPath,
    message: errorMessage2
  };
};
function addIssueToContext(ctx, issueData) {
  const overrideMap = getErrorMap();
  const issue = makeIssue({
    issueData,
    data: ctx.data,
    path: ctx.path,
    errorMaps: [
      ctx.common.contextualErrorMap,
      // contextual error map is first priority
      ctx.schemaErrorMap,
      // then schema-bound map if available
      overrideMap,
      // then global override map
      overrideMap === errorMap ? void 0 : errorMap
      // then global default map
    ].filter((x) => !!x)
  });
  ctx.common.issues.push(issue);
}
class ParseStatus {
  constructor() {
    this.value = "valid";
  }
  dirty() {
    if (this.value === "valid")
      this.value = "dirty";
  }
  abort() {
    if (this.value !== "aborted")
      this.value = "aborted";
  }
  static mergeArray(status, results) {
    const arrayValue = [];
    for (const s of results) {
      if (s.status === "aborted")
        return INVALID;
      if (s.status === "dirty")
        status.dirty();
      arrayValue.push(s.value);
    }
    return { status: status.value, value: arrayValue };
  }
  static async mergeObjectAsync(status, pairs) {
    const syncPairs = [];
    for (const pair of pairs) {
      const key = await pair.key;
      const value = await pair.value;
      syncPairs.push({
        key,
        value
      });
    }
    return ParseStatus.mergeObjectSync(status, syncPairs);
  }
  static mergeObjectSync(status, pairs) {
    const finalObject = {};
    for (const pair of pairs) {
      const { key, value } = pair;
      if (key.status === "aborted")
        return INVALID;
      if (value.status === "aborted")
        return INVALID;
      if (key.status === "dirty")
        status.dirty();
      if (value.status === "dirty")
        status.dirty();
      if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
        finalObject[key.value] = value.value;
      }
    }
    return { status: status.value, value: finalObject };
  }
}
const INVALID = Object.freeze({
  status: "aborted"
});
const DIRTY = (value) => ({ status: "dirty", value });
const OK = (value) => ({ status: "valid", value });
const isAborted = (x) => x.status === "aborted";
const isDirty = (x) => x.status === "dirty";
const isValid = (x) => x.status === "valid";
const isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;
var errorUtil;
(function(errorUtil2) {
  errorUtil2.errToObj = (message) => typeof message === "string" ? { message } : message || {};
  errorUtil2.toString = (message) => typeof message === "string" ? message : message?.message;
})(errorUtil || (errorUtil = {}));
class ParseInputLazyPath {
  constructor(parent, value, path, key) {
    this._cachedPath = [];
    this.parent = parent;
    this.data = value;
    this._path = path;
    this._key = key;
  }
  get path() {
    if (!this._cachedPath.length) {
      if (Array.isArray(this._key)) {
        this._cachedPath.push(...this._path, ...this._key);
      } else {
        this._cachedPath.push(...this._path, this._key);
      }
    }
    return this._cachedPath;
  }
}
const handleResult = (ctx, result) => {
  if (isValid(result)) {
    return { success: true, data: result.value };
  } else {
    if (!ctx.common.issues.length) {
      throw new Error("Validation failed but no issues detected.");
    }
    return {
      success: false,
      get error() {
        if (this._error)
          return this._error;
        const error = new ZodError(ctx.common.issues);
        this._error = error;
        return this._error;
      }
    };
  }
};
function processCreateParams(params) {
  if (!params)
    return {};
  const { errorMap: errorMap2, invalid_type_error, required_error, description } = params;
  if (errorMap2 && (invalid_type_error || required_error)) {
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  }
  if (errorMap2)
    return { errorMap: errorMap2, description };
  const customMap = (iss, ctx) => {
    const { message } = params;
    if (iss.code === "invalid_enum_value") {
      return { message: message ?? ctx.defaultError };
    }
    if (typeof ctx.data === "undefined") {
      return { message: message ?? required_error ?? ctx.defaultError };
    }
    if (iss.code !== "invalid_type")
      return { message: ctx.defaultError };
    return { message: message ?? invalid_type_error ?? ctx.defaultError };
  };
  return { errorMap: customMap, description };
}
class ZodType {
  get description() {
    return this._def.description;
  }
  _getType(input) {
    return getParsedType(input.data);
  }
  _getOrReturnCtx(input, ctx) {
    return ctx || {
      common: input.parent.common,
      data: input.data,
      parsedType: getParsedType(input.data),
      schemaErrorMap: this._def.errorMap,
      path: input.path,
      parent: input.parent
    };
  }
  _processInputParams(input) {
    return {
      status: new ParseStatus(),
      ctx: {
        common: input.parent.common,
        data: input.data,
        parsedType: getParsedType(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent
      }
    };
  }
  _parseSync(input) {
    const result = this._parse(input);
    if (isAsync(result)) {
      throw new Error("Synchronous parse encountered promise.");
    }
    return result;
  }
  _parseAsync(input) {
    const result = this._parse(input);
    return Promise.resolve(result);
  }
  parse(data, params) {
    const result = this.safeParse(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  safeParse(data, params) {
    const ctx = {
      common: {
        issues: [],
        async: params?.async ?? false,
        contextualErrorMap: params?.errorMap
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const result = this._parseSync({ data, path: ctx.path, parent: ctx });
    return handleResult(ctx, result);
  }
  "~validate"(data) {
    const ctx = {
      common: {
        issues: [],
        async: !!this["~standard"].async
      },
      path: [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    if (!this["~standard"].async) {
      try {
        const result = this._parseSync({ data, path: [], parent: ctx });
        return isValid(result) ? {
          value: result.value
        } : {
          issues: ctx.common.issues
        };
      } catch (err) {
        if (err?.message?.toLowerCase()?.includes("encountered")) {
          this["~standard"].async = true;
        }
        ctx.common = {
          issues: [],
          async: true
        };
      }
    }
    return this._parseAsync({ data, path: [], parent: ctx }).then((result) => isValid(result) ? {
      value: result.value
    } : {
      issues: ctx.common.issues
    });
  }
  async parseAsync(data, params) {
    const result = await this.safeParseAsync(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  async safeParseAsync(data, params) {
    const ctx = {
      common: {
        issues: [],
        contextualErrorMap: params?.errorMap,
        async: true
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
    const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
    return handleResult(ctx, result);
  }
  refine(check, message) {
    const getIssueProperties = (val) => {
      if (typeof message === "string" || typeof message === "undefined") {
        return { message };
      } else if (typeof message === "function") {
        return message(val);
      } else {
        return message;
      }
    };
    return this._refinement((val, ctx) => {
      const result = check(val);
      const setError = () => ctx.addIssue({
        code: ZodIssueCode.custom,
        ...getIssueProperties(val)
      });
      if (typeof Promise !== "undefined" && result instanceof Promise) {
        return result.then((data) => {
          if (!data) {
            setError();
            return false;
          } else {
            return true;
          }
        });
      }
      if (!result) {
        setError();
        return false;
      } else {
        return true;
      }
    });
  }
  refinement(check, refinementData) {
    return this._refinement((val, ctx) => {
      if (!check(val)) {
        ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
        return false;
      } else {
        return true;
      }
    });
  }
  _refinement(refinement) {
    return new ZodEffects({
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "refinement", refinement }
    });
  }
  superRefine(refinement) {
    return this._refinement(refinement);
  }
  constructor(def) {
    this.spa = this.safeParseAsync;
    this._def = def;
    this.parse = this.parse.bind(this);
    this.safeParse = this.safeParse.bind(this);
    this.parseAsync = this.parseAsync.bind(this);
    this.safeParseAsync = this.safeParseAsync.bind(this);
    this.spa = this.spa.bind(this);
    this.refine = this.refine.bind(this);
    this.refinement = this.refinement.bind(this);
    this.superRefine = this.superRefine.bind(this);
    this.optional = this.optional.bind(this);
    this.nullable = this.nullable.bind(this);
    this.nullish = this.nullish.bind(this);
    this.array = this.array.bind(this);
    this.promise = this.promise.bind(this);
    this.or = this.or.bind(this);
    this.and = this.and.bind(this);
    this.transform = this.transform.bind(this);
    this.brand = this.brand.bind(this);
    this.default = this.default.bind(this);
    this.catch = this.catch.bind(this);
    this.describe = this.describe.bind(this);
    this.pipe = this.pipe.bind(this);
    this.readonly = this.readonly.bind(this);
    this.isNullable = this.isNullable.bind(this);
    this.isOptional = this.isOptional.bind(this);
    this["~standard"] = {
      version: 1,
      vendor: "zod",
      validate: (data) => this["~validate"](data)
    };
  }
  optional() {
    return ZodOptional.create(this, this._def);
  }
  nullable() {
    return ZodNullable.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return ZodArray.create(this);
  }
  promise() {
    return ZodPromise.create(this, this._def);
  }
  or(option) {
    return ZodUnion.create([this, option], this._def);
  }
  and(incoming) {
    return ZodIntersection.create(this, incoming, this._def);
  }
  transform(transform) {
    return new ZodEffects({
      ...processCreateParams(this._def),
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "transform", transform }
    });
  }
  default(def) {
    const defaultValueFunc = typeof def === "function" ? def : () => def;
    return new ZodDefault({
      ...processCreateParams(this._def),
      innerType: this,
      defaultValue: defaultValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodDefault
    });
  }
  brand() {
    return new ZodBranded({
      typeName: ZodFirstPartyTypeKind.ZodBranded,
      type: this,
      ...processCreateParams(this._def)
    });
  }
  catch(def) {
    const catchValueFunc = typeof def === "function" ? def : () => def;
    return new ZodCatch({
      ...processCreateParams(this._def),
      innerType: this,
      catchValue: catchValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodCatch
    });
  }
  describe(description) {
    const This = this.constructor;
    return new This({
      ...this._def,
      description
    });
  }
  pipe(target) {
    return ZodPipeline.create(this, target);
  }
  readonly() {
    return ZodReadonly.create(this);
  }
  isOptional() {
    return this.safeParse(void 0).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
}
const cuidRegex = /^c[^\s-]{8,}$/i;
const cuid2Regex = /^[0-9a-z]+$/;
const ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
const uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
const nanoidRegex = /^[a-z0-9_-]{21}$/i;
const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
const durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
const emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
const _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
let emojiRegex;
const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
const ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
const ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
const base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
const base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
const dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
const dateRegex = new RegExp(`^${dateRegexSource}$`);
function timeRegexSource(args) {
  let secondsRegexSource = `[0-5]\\d`;
  if (args.precision) {
    secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
  } else if (args.precision == null) {
    secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
  }
  const secondsQuantifier = args.precision ? "+" : "?";
  return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
}
function timeRegex(args) {
  return new RegExp(`^${timeRegexSource(args)}$`);
}
function datetimeRegex(args) {
  let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
  const opts = [];
  opts.push(args.local ? `Z?` : `Z`);
  if (args.offset)
    opts.push(`([+-]\\d{2}:?\\d{2})`);
  regex = `${regex}(${opts.join("|")})`;
  return new RegExp(`^${regex}$`);
}
function isValidIP(ip, version) {
  if ((version === "v4" || !version) && ipv4Regex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6Regex.test(ip)) {
    return true;
  }
  return false;
}
function isValidJWT(jwt, alg) {
  if (!jwtRegex.test(jwt))
    return false;
  try {
    const [header] = jwt.split(".");
    if (!header)
      return false;
    const base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
    const decoded = JSON.parse(atob(base64));
    if (typeof decoded !== "object" || decoded === null)
      return false;
    if ("typ" in decoded && decoded?.typ !== "JWT")
      return false;
    if (!decoded.alg)
      return false;
    if (alg && decoded.alg !== alg)
      return false;
    return true;
  } catch {
    return false;
  }
}
function isValidCidr(ip, version) {
  if ((version === "v4" || !version) && ipv4CidrRegex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6CidrRegex.test(ip)) {
    return true;
  }
  return false;
}
class ZodString extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = String(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.string) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.string,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.length < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.length > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "length") {
        const tooBig = input.data.length > check.value;
        const tooSmall = input.data.length < check.value;
        if (tooBig || tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          if (tooBig) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          } else if (tooSmall) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          }
          status.dirty();
        }
      } else if (check.kind === "email") {
        if (!emailRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "email",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "emoji") {
        if (!emojiRegex) {
          emojiRegex = new RegExp(_emojiRegex, "u");
        }
        if (!emojiRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "emoji",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "uuid") {
        if (!uuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "uuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "nanoid") {
        if (!nanoidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "nanoid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid") {
        if (!cuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid2") {
        if (!cuid2Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid2",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ulid") {
        if (!ulidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ulid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "url") {
        try {
          new URL(input.data);
        } catch {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "regex") {
        check.regex.lastIndex = 0;
        const testResult = check.regex.test(input.data);
        if (!testResult) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "regex",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "trim") {
        input.data = input.data.trim();
      } else if (check.kind === "includes") {
        if (!input.data.includes(check.value, check.position)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { includes: check.value, position: check.position },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "toLowerCase") {
        input.data = input.data.toLowerCase();
      } else if (check.kind === "toUpperCase") {
        input.data = input.data.toUpperCase();
      } else if (check.kind === "startsWith") {
        if (!input.data.startsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { startsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "endsWith") {
        if (!input.data.endsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { endsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "datetime") {
        const regex = datetimeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "datetime",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "date") {
        const regex = dateRegex;
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "date",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "time") {
        const regex = timeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "time",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "duration") {
        if (!durationRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "duration",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ip") {
        if (!isValidIP(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ip",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "jwt") {
        if (!isValidJWT(input.data, check.alg)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "jwt",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cidr") {
        if (!isValidCidr(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cidr",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64") {
        if (!base64Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64url") {
        if (!base64urlRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _regex(regex, validation, message) {
    return this.refinement((data) => regex.test(data), {
      validation,
      code: ZodIssueCode.invalid_string,
      ...errorUtil.errToObj(message)
    });
  }
  _addCheck(check) {
    return new ZodString({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  email(message) {
    return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
  }
  url(message) {
    return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
  }
  emoji(message) {
    return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
  }
  uuid(message) {
    return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
  }
  nanoid(message) {
    return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
  }
  cuid(message) {
    return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
  }
  cuid2(message) {
    return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
  }
  ulid(message) {
    return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
  }
  base64(message) {
    return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
  }
  base64url(message) {
    return this._addCheck({
      kind: "base64url",
      ...errorUtil.errToObj(message)
    });
  }
  jwt(options) {
    return this._addCheck({ kind: "jwt", ...errorUtil.errToObj(options) });
  }
  ip(options) {
    return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
  }
  cidr(options) {
    return this._addCheck({ kind: "cidr", ...errorUtil.errToObj(options) });
  }
  datetime(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "datetime",
        precision: null,
        offset: false,
        local: false,
        message: options
      });
    }
    return this._addCheck({
      kind: "datetime",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      offset: options?.offset ?? false,
      local: options?.local ?? false,
      ...errorUtil.errToObj(options?.message)
    });
  }
  date(message) {
    return this._addCheck({ kind: "date", message });
  }
  time(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "time",
        precision: null,
        message: options
      });
    }
    return this._addCheck({
      kind: "time",
      precision: typeof options?.precision === "undefined" ? null : options?.precision,
      ...errorUtil.errToObj(options?.message)
    });
  }
  duration(message) {
    return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
  }
  regex(regex, message) {
    return this._addCheck({
      kind: "regex",
      regex,
      ...errorUtil.errToObj(message)
    });
  }
  includes(value, options) {
    return this._addCheck({
      kind: "includes",
      value,
      position: options?.position,
      ...errorUtil.errToObj(options?.message)
    });
  }
  startsWith(value, message) {
    return this._addCheck({
      kind: "startsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  endsWith(value, message) {
    return this._addCheck({
      kind: "endsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  min(minLength, message) {
    return this._addCheck({
      kind: "min",
      value: minLength,
      ...errorUtil.errToObj(message)
    });
  }
  max(maxLength, message) {
    return this._addCheck({
      kind: "max",
      value: maxLength,
      ...errorUtil.errToObj(message)
    });
  }
  length(len, message) {
    return this._addCheck({
      kind: "length",
      value: len,
      ...errorUtil.errToObj(message)
    });
  }
  /**
   * Equivalent to `.min(1)`
   */
  nonempty(message) {
    return this.min(1, errorUtil.errToObj(message));
  }
  trim() {
    return new ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  toLowerCase() {
    return new ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    });
  }
  toUpperCase() {
    return new ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toUpperCase" }]
    });
  }
  get isDatetime() {
    return !!this._def.checks.find((ch) => ch.kind === "datetime");
  }
  get isDate() {
    return !!this._def.checks.find((ch) => ch.kind === "date");
  }
  get isTime() {
    return !!this._def.checks.find((ch) => ch.kind === "time");
  }
  get isDuration() {
    return !!this._def.checks.find((ch) => ch.kind === "duration");
  }
  get isEmail() {
    return !!this._def.checks.find((ch) => ch.kind === "email");
  }
  get isURL() {
    return !!this._def.checks.find((ch) => ch.kind === "url");
  }
  get isEmoji() {
    return !!this._def.checks.find((ch) => ch.kind === "emoji");
  }
  get isUUID() {
    return !!this._def.checks.find((ch) => ch.kind === "uuid");
  }
  get isNANOID() {
    return !!this._def.checks.find((ch) => ch.kind === "nanoid");
  }
  get isCUID() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid");
  }
  get isCUID2() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid2");
  }
  get isULID() {
    return !!this._def.checks.find((ch) => ch.kind === "ulid");
  }
  get isIP() {
    return !!this._def.checks.find((ch) => ch.kind === "ip");
  }
  get isCIDR() {
    return !!this._def.checks.find((ch) => ch.kind === "cidr");
  }
  get isBase64() {
    return !!this._def.checks.find((ch) => ch.kind === "base64");
  }
  get isBase64url() {
    return !!this._def.checks.find((ch) => ch.kind === "base64url");
  }
  get minLength() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxLength() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
}
ZodString.create = (params) => {
  return new ZodString({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodString,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
function floatSafeRemainder(val, step) {
  const valDecCount = (val.toString().split(".")[1] || "").length;
  const stepDecCount = (step.toString().split(".")[1] || "").length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
  const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / 10 ** decCount;
}
class ZodNumber extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
    this.step = this.multipleOf;
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = Number(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.number) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.number,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "int") {
        if (!util.isInteger(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: "integer",
            received: "float",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (floatSafeRemainder(input.data, check.value) !== 0) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "finite") {
        if (!Number.isFinite(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_finite,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new ZodNumber({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new ZodNumber({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  int(message) {
    return this._addCheck({
      kind: "int",
      message: errorUtil.toString(message)
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  finite(message) {
    return this._addCheck({
      kind: "finite",
      message: errorUtil.toString(message)
    });
  }
  safe(message) {
    return this._addCheck({
      kind: "min",
      inclusive: true,
      value: Number.MIN_SAFE_INTEGER,
      message: errorUtil.toString(message)
    })._addCheck({
      kind: "max",
      inclusive: true,
      value: Number.MAX_SAFE_INTEGER,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
  get isInt() {
    return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
  }
  get isFinite() {
    let max = null;
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
        return true;
      } else if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      } else if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return Number.isFinite(min) && Number.isFinite(max);
  }
}
ZodNumber.create = (params) => {
  return new ZodNumber({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodNumber,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
class ZodBigInt extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
  }
  _parse(input) {
    if (this._def.coerce) {
      try {
        input.data = BigInt(input.data);
      } catch {
        return this._getInvalidInput(input);
      }
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.bigint) {
      return this._getInvalidInput(input);
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            type: "bigint",
            minimum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            type: "bigint",
            maximum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (input.data % check.value !== BigInt(0)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _getInvalidInput(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.bigint,
      received: ctx.parsedType
    });
    return INVALID;
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new ZodBigInt({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new ZodBigInt({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
}
ZodBigInt.create = (params) => {
  return new ZodBigInt({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodBigInt,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
class ZodBoolean extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = Boolean(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.boolean) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.boolean,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
}
ZodBoolean.create = (params) => {
  return new ZodBoolean({
    typeName: ZodFirstPartyTypeKind.ZodBoolean,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
class ZodDate extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = new Date(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.date) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.date,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    if (Number.isNaN(input.data.getTime())) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_date
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.getTime() < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            message: check.message,
            inclusive: true,
            exact: false,
            minimum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.getTime() > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            message: check.message,
            inclusive: true,
            exact: false,
            maximum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return {
      status: status.value,
      value: new Date(input.data.getTime())
    };
  }
  _addCheck(check) {
    return new ZodDate({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  min(minDate, message) {
    return this._addCheck({
      kind: "min",
      value: minDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  max(maxDate, message) {
    return this._addCheck({
      kind: "max",
      value: maxDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  get minDate() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min != null ? new Date(min) : null;
  }
  get maxDate() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max != null ? new Date(max) : null;
  }
}
ZodDate.create = (params) => {
  return new ZodDate({
    checks: [],
    coerce: params?.coerce || false,
    typeName: ZodFirstPartyTypeKind.ZodDate,
    ...processCreateParams(params)
  });
};
class ZodSymbol extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.symbol) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.symbol,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
}
ZodSymbol.create = (params) => {
  return new ZodSymbol({
    typeName: ZodFirstPartyTypeKind.ZodSymbol,
    ...processCreateParams(params)
  });
};
class ZodUndefined extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.undefined,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
}
ZodUndefined.create = (params) => {
  return new ZodUndefined({
    typeName: ZodFirstPartyTypeKind.ZodUndefined,
    ...processCreateParams(params)
  });
};
class ZodNull extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.null) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.null,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
}
ZodNull.create = (params) => {
  return new ZodNull({
    typeName: ZodFirstPartyTypeKind.ZodNull,
    ...processCreateParams(params)
  });
};
class ZodAny extends ZodType {
  constructor() {
    super(...arguments);
    this._any = true;
  }
  _parse(input) {
    return OK(input.data);
  }
}
ZodAny.create = (params) => {
  return new ZodAny({
    typeName: ZodFirstPartyTypeKind.ZodAny,
    ...processCreateParams(params)
  });
};
class ZodUnknown extends ZodType {
  constructor() {
    super(...arguments);
    this._unknown = true;
  }
  _parse(input) {
    return OK(input.data);
  }
}
ZodUnknown.create = (params) => {
  return new ZodUnknown({
    typeName: ZodFirstPartyTypeKind.ZodUnknown,
    ...processCreateParams(params)
  });
};
class ZodNever extends ZodType {
  _parse(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.never,
      received: ctx.parsedType
    });
    return INVALID;
  }
}
ZodNever.create = (params) => {
  return new ZodNever({
    typeName: ZodFirstPartyTypeKind.ZodNever,
    ...processCreateParams(params)
  });
};
class ZodVoid extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.void,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
}
ZodVoid.create = (params) => {
  return new ZodVoid({
    typeName: ZodFirstPartyTypeKind.ZodVoid,
    ...processCreateParams(params)
  });
};
class ZodArray extends ZodType {
  _parse(input) {
    const { ctx, status } = this._processInputParams(input);
    const def = this._def;
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (def.exactLength !== null) {
      const tooBig = ctx.data.length > def.exactLength.value;
      const tooSmall = ctx.data.length < def.exactLength.value;
      if (tooBig || tooSmall) {
        addIssueToContext(ctx, {
          code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
          minimum: tooSmall ? def.exactLength.value : void 0,
          maximum: tooBig ? def.exactLength.value : void 0,
          type: "array",
          inclusive: true,
          exact: true,
          message: def.exactLength.message
        });
        status.dirty();
      }
    }
    if (def.minLength !== null) {
      if (ctx.data.length < def.minLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.minLength.message
        });
        status.dirty();
      }
    }
    if (def.maxLength !== null) {
      if (ctx.data.length > def.maxLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.maxLength.message
        });
        status.dirty();
      }
    }
    if (ctx.common.async) {
      return Promise.all([...ctx.data].map((item, i) => {
        return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
      })).then((result2) => {
        return ParseStatus.mergeArray(status, result2);
      });
    }
    const result = [...ctx.data].map((item, i) => {
      return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
    });
    return ParseStatus.mergeArray(status, result);
  }
  get element() {
    return this._def.type;
  }
  min(minLength, message) {
    return new ZodArray({
      ...this._def,
      minLength: { value: minLength, message: errorUtil.toString(message) }
    });
  }
  max(maxLength, message) {
    return new ZodArray({
      ...this._def,
      maxLength: { value: maxLength, message: errorUtil.toString(message) }
    });
  }
  length(len, message) {
    return new ZodArray({
      ...this._def,
      exactLength: { value: len, message: errorUtil.toString(message) }
    });
  }
  nonempty(message) {
    return this.min(1, message);
  }
}
ZodArray.create = (schema, params) => {
  return new ZodArray({
    type: schema,
    minLength: null,
    maxLength: null,
    exactLength: null,
    typeName: ZodFirstPartyTypeKind.ZodArray,
    ...processCreateParams(params)
  });
};
function deepPartialify(schema) {
  if (schema instanceof ZodObject) {
    const newShape = {};
    for (const key in schema.shape) {
      const fieldSchema = schema.shape[key];
      newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
    }
    return new ZodObject({
      ...schema._def,
      shape: () => newShape
    });
  } else if (schema instanceof ZodArray) {
    return new ZodArray({
      ...schema._def,
      type: deepPartialify(schema.element)
    });
  } else if (schema instanceof ZodOptional) {
    return ZodOptional.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodNullable) {
    return ZodNullable.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodTuple) {
    return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
  } else {
    return schema;
  }
}
class ZodObject extends ZodType {
  constructor() {
    super(...arguments);
    this._cached = null;
    this.nonstrict = this.passthrough;
    this.augment = this.extend;
  }
  _getCached() {
    if (this._cached !== null)
      return this._cached;
    const shape = this._def.shape();
    const keys = util.objectKeys(shape);
    this._cached = { shape, keys };
    return this._cached;
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.object) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const { status, ctx } = this._processInputParams(input);
    const { shape, keys: shapeKeys } = this._getCached();
    const extraKeys = [];
    if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
      for (const key in ctx.data) {
        if (!shapeKeys.includes(key)) {
          extraKeys.push(key);
        }
      }
    }
    const pairs = [];
    for (const key of shapeKeys) {
      const keyValidator = shape[key];
      const value = ctx.data[key];
      pairs.push({
        key: { status: "valid", value: key },
        value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (this._def.catchall instanceof ZodNever) {
      const unknownKeys = this._def.unknownKeys;
      if (unknownKeys === "passthrough") {
        for (const key of extraKeys) {
          pairs.push({
            key: { status: "valid", value: key },
            value: { status: "valid", value: ctx.data[key] }
          });
        }
      } else if (unknownKeys === "strict") {
        if (extraKeys.length > 0) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.unrecognized_keys,
            keys: extraKeys
          });
          status.dirty();
        }
      } else if (unknownKeys === "strip") ;
      else {
        throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
      }
    } else {
      const catchall = this._def.catchall;
      for (const key of extraKeys) {
        const value = ctx.data[key];
        pairs.push({
          key: { status: "valid", value: key },
          value: catchall._parse(
            new ParseInputLazyPath(ctx, value, ctx.path, key)
            //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: key in ctx.data
        });
      }
    }
    if (ctx.common.async) {
      return Promise.resolve().then(async () => {
        const syncPairs = [];
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          syncPairs.push({
            key,
            value,
            alwaysSet: pair.alwaysSet
          });
        }
        return syncPairs;
      }).then((syncPairs) => {
        return ParseStatus.mergeObjectSync(status, syncPairs);
      });
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get shape() {
    return this._def.shape();
  }
  strict(message) {
    errorUtil.errToObj;
    return new ZodObject({
      ...this._def,
      unknownKeys: "strict",
      ...message !== void 0 ? {
        errorMap: (issue, ctx) => {
          const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError;
          if (issue.code === "unrecognized_keys")
            return {
              message: errorUtil.errToObj(message).message ?? defaultError
            };
          return {
            message: defaultError
          };
        }
      } : {}
    });
  }
  strip() {
    return new ZodObject({
      ...this._def,
      unknownKeys: "strip"
    });
  }
  passthrough() {
    return new ZodObject({
      ...this._def,
      unknownKeys: "passthrough"
    });
  }
  // const AugmentFactory =
  //   <Def extends ZodObjectDef>(def: Def) =>
  //   <Augmentation extends ZodRawShape>(
  //     augmentation: Augmentation
  //   ): ZodObject<
  //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
  //     Def["unknownKeys"],
  //     Def["catchall"]
  //   > => {
  //     return new ZodObject({
  //       ...def,
  //       shape: () => ({
  //         ...def.shape(),
  //         ...augmentation,
  //       }),
  //     }) as any;
  //   };
  extend(augmentation) {
    return new ZodObject({
      ...this._def,
      shape: () => ({
        ...this._def.shape(),
        ...augmentation
      })
    });
  }
  /**
   * Prior to zod@1.0.12 there was a bug in the
   * inferred type of merged objects. Please
   * upgrade if you are experiencing issues.
   */
  merge(merging) {
    const merged = new ZodObject({
      unknownKeys: merging._def.unknownKeys,
      catchall: merging._def.catchall,
      shape: () => ({
        ...this._def.shape(),
        ...merging._def.shape()
      }),
      typeName: ZodFirstPartyTypeKind.ZodObject
    });
    return merged;
  }
  // merge<
  //   Incoming extends AnyZodObject,
  //   Augmentation extends Incoming["shape"],
  //   NewOutput extends {
  //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
  //       ? Augmentation[k]["_output"]
  //       : k extends keyof Output
  //       ? Output[k]
  //       : never;
  //   },
  //   NewInput extends {
  //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
  //       ? Augmentation[k]["_input"]
  //       : k extends keyof Input
  //       ? Input[k]
  //       : never;
  //   }
  // >(
  //   merging: Incoming
  // ): ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"],
  //   NewOutput,
  //   NewInput
  // > {
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  setKey(key, schema) {
    return this.augment({ [key]: schema });
  }
  // merge<Incoming extends AnyZodObject>(
  //   merging: Incoming
  // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
  // ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"]
  // > {
  //   // const mergedShape = objectUtil.mergeShapes(
  //   //   this._def.shape(),
  //   //   merging._def.shape()
  //   // );
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  catchall(index) {
    return new ZodObject({
      ...this._def,
      catchall: index
    });
  }
  pick(mask) {
    const shape = {};
    for (const key of util.objectKeys(mask)) {
      if (mask[key] && this.shape[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  omit(mask) {
    const shape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (!mask[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  /**
   * @deprecated
   */
  deepPartial() {
    return deepPartialify(this);
  }
  partial(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      const fieldSchema = this.shape[key];
      if (mask && !mask[key]) {
        newShape[key] = fieldSchema;
      } else {
        newShape[key] = fieldSchema.optional();
      }
    }
    return new ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  required(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (mask && !mask[key]) {
        newShape[key] = this.shape[key];
      } else {
        const fieldSchema = this.shape[key];
        let newField = fieldSchema;
        while (newField instanceof ZodOptional) {
          newField = newField._def.innerType;
        }
        newShape[key] = newField;
      }
    }
    return new ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  keyof() {
    return createZodEnum(util.objectKeys(this.shape));
  }
}
ZodObject.create = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.strictCreate = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strict",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.lazycreate = (shape, params) => {
  return new ZodObject({
    shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
class ZodUnion extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const options = this._def.options;
    function handleResults(results) {
      for (const result of results) {
        if (result.result.status === "valid") {
          return result.result;
        }
      }
      for (const result of results) {
        if (result.result.status === "dirty") {
          ctx.common.issues.push(...result.ctx.common.issues);
          return result.result;
        }
      }
      const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return Promise.all(options.map(async (option) => {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        return {
          result: await option._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: childCtx
          }),
          ctx: childCtx
        };
      })).then(handleResults);
    } else {
      let dirty = void 0;
      const issues = [];
      for (const option of options) {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        const result = option._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: childCtx
        });
        if (result.status === "valid") {
          return result;
        } else if (result.status === "dirty" && !dirty) {
          dirty = { result, ctx: childCtx };
        }
        if (childCtx.common.issues.length) {
          issues.push(childCtx.common.issues);
        }
      }
      if (dirty) {
        ctx.common.issues.push(...dirty.ctx.common.issues);
        return dirty.result;
      }
      const unionErrors = issues.map((issues2) => new ZodError(issues2));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
  }
  get options() {
    return this._def.options;
  }
}
ZodUnion.create = (types, params) => {
  return new ZodUnion({
    options: types,
    typeName: ZodFirstPartyTypeKind.ZodUnion,
    ...processCreateParams(params)
  });
};
function mergeValues(a, b) {
  const aType = getParsedType(a);
  const bType = getParsedType(b);
  if (a === b) {
    return { valid: true, data: a };
  } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
    const bKeys = util.objectKeys(b);
    const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
    if (a.length !== b.length) {
      return { valid: false };
    }
    const newArray = [];
    for (let index = 0; index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
    return { valid: true, data: a };
  } else {
    return { valid: false };
  }
}
class ZodIntersection extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const handleParsed = (parsedLeft, parsedRight) => {
      if (isAborted(parsedLeft) || isAborted(parsedRight)) {
        return INVALID;
      }
      const merged = mergeValues(parsedLeft.value, parsedRight.value);
      if (!merged.valid) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_intersection_types
        });
        return INVALID;
      }
      if (isDirty(parsedLeft) || isDirty(parsedRight)) {
        status.dirty();
      }
      return { status: status.value, value: merged.data };
    };
    if (ctx.common.async) {
      return Promise.all([
        this._def.left._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }),
        this._def.right._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        })
      ]).then(([left, right]) => handleParsed(left, right));
    } else {
      return handleParsed(this._def.left._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }), this._def.right._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }));
    }
  }
}
ZodIntersection.create = (left, right, params) => {
  return new ZodIntersection({
    left,
    right,
    typeName: ZodFirstPartyTypeKind.ZodIntersection,
    ...processCreateParams(params)
  });
};
class ZodTuple extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (ctx.data.length < this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        minimum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      return INVALID;
    }
    const rest = this._def.rest;
    if (!rest && ctx.data.length > this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_big,
        maximum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      status.dirty();
    }
    const items = [...ctx.data].map((item, itemIndex) => {
      const schema = this._def.items[itemIndex] || this._def.rest;
      if (!schema)
        return null;
      return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
    }).filter((x) => !!x);
    if (ctx.common.async) {
      return Promise.all(items).then((results) => {
        return ParseStatus.mergeArray(status, results);
      });
    } else {
      return ParseStatus.mergeArray(status, items);
    }
  }
  get items() {
    return this._def.items;
  }
  rest(rest) {
    return new ZodTuple({
      ...this._def,
      rest
    });
  }
}
ZodTuple.create = (schemas, params) => {
  if (!Array.isArray(schemas)) {
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  }
  return new ZodTuple({
    items: schemas,
    typeName: ZodFirstPartyTypeKind.ZodTuple,
    rest: null,
    ...processCreateParams(params)
  });
};
class ZodRecord extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const pairs = [];
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    for (const key in ctx.data) {
      pairs.push({
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
        value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (ctx.common.async) {
      return ParseStatus.mergeObjectAsync(status, pairs);
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get element() {
    return this._def.valueType;
  }
  static create(first, second, third) {
    if (second instanceof ZodType) {
      return new ZodRecord({
        keyType: first,
        valueType: second,
        typeName: ZodFirstPartyTypeKind.ZodRecord,
        ...processCreateParams(third)
      });
    }
    return new ZodRecord({
      keyType: ZodString.create(),
      valueType: first,
      typeName: ZodFirstPartyTypeKind.ZodRecord,
      ...processCreateParams(second)
    });
  }
}
class ZodMap extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.map) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.map,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    const pairs = [...ctx.data.entries()].map(([key, value], index) => {
      return {
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
        value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
      };
    });
    if (ctx.common.async) {
      const finalMap = /* @__PURE__ */ new Map();
      return Promise.resolve().then(async () => {
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          if (key.status === "aborted" || value.status === "aborted") {
            return INVALID;
          }
          if (key.status === "dirty" || value.status === "dirty") {
            status.dirty();
          }
          finalMap.set(key.value, value.value);
        }
        return { status: status.value, value: finalMap };
      });
    } else {
      const finalMap = /* @__PURE__ */ new Map();
      for (const pair of pairs) {
        const key = pair.key;
        const value = pair.value;
        if (key.status === "aborted" || value.status === "aborted") {
          return INVALID;
        }
        if (key.status === "dirty" || value.status === "dirty") {
          status.dirty();
        }
        finalMap.set(key.value, value.value);
      }
      return { status: status.value, value: finalMap };
    }
  }
}
ZodMap.create = (keyType, valueType, params) => {
  return new ZodMap({
    valueType,
    keyType,
    typeName: ZodFirstPartyTypeKind.ZodMap,
    ...processCreateParams(params)
  });
};
class ZodSet extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.set) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.set,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const def = this._def;
    if (def.minSize !== null) {
      if (ctx.data.size < def.minSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.minSize.message
        });
        status.dirty();
      }
    }
    if (def.maxSize !== null) {
      if (ctx.data.size > def.maxSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.maxSize.message
        });
        status.dirty();
      }
    }
    const valueType = this._def.valueType;
    function finalizeSet(elements2) {
      const parsedSet = /* @__PURE__ */ new Set();
      for (const element of elements2) {
        if (element.status === "aborted")
          return INVALID;
        if (element.status === "dirty")
          status.dirty();
        parsedSet.add(element.value);
      }
      return { status: status.value, value: parsedSet };
    }
    const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
    if (ctx.common.async) {
      return Promise.all(elements).then((elements2) => finalizeSet(elements2));
    } else {
      return finalizeSet(elements);
    }
  }
  min(minSize, message) {
    return new ZodSet({
      ...this._def,
      minSize: { value: minSize, message: errorUtil.toString(message) }
    });
  }
  max(maxSize, message) {
    return new ZodSet({
      ...this._def,
      maxSize: { value: maxSize, message: errorUtil.toString(message) }
    });
  }
  size(size, message) {
    return this.min(size, message).max(size, message);
  }
  nonempty(message) {
    return this.min(1, message);
  }
}
ZodSet.create = (valueType, params) => {
  return new ZodSet({
    valueType,
    minSize: null,
    maxSize: null,
    typeName: ZodFirstPartyTypeKind.ZodSet,
    ...processCreateParams(params)
  });
};
class ZodLazy extends ZodType {
  get schema() {
    return this._def.getter();
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const lazySchema = this._def.getter();
    return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
  }
}
ZodLazy.create = (getter, params) => {
  return new ZodLazy({
    getter,
    typeName: ZodFirstPartyTypeKind.ZodLazy,
    ...processCreateParams(params)
  });
};
class ZodLiteral extends ZodType {
  _parse(input) {
    if (input.data !== this._def.value) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_literal,
        expected: this._def.value
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
  get value() {
    return this._def.value;
  }
}
ZodLiteral.create = (value, params) => {
  return new ZodLiteral({
    value,
    typeName: ZodFirstPartyTypeKind.ZodLiteral,
    ...processCreateParams(params)
  });
};
function createZodEnum(values, params) {
  return new ZodEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodEnum,
    ...processCreateParams(params)
  });
}
class ZodEnum extends ZodType {
  _parse(input) {
    if (typeof input.data !== "string") {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(this._def.values);
    }
    if (!this._cache.has(input.data)) {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get options() {
    return this._def.values;
  }
  get enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Values() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  extract(values, newDef = this._def) {
    return ZodEnum.create(values, {
      ...this._def,
      ...newDef
    });
  }
  exclude(values, newDef = this._def) {
    return ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
      ...this._def,
      ...newDef
    });
  }
}
ZodEnum.create = createZodEnum;
class ZodNativeEnum extends ZodType {
  _parse(input) {
    const nativeEnumValues = util.getValidEnumValues(this._def.values);
    const ctx = this._getOrReturnCtx(input);
    if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(util.getValidEnumValues(this._def.values));
    }
    if (!this._cache.has(input.data)) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get enum() {
    return this._def.values;
  }
}
ZodNativeEnum.create = (values, params) => {
  return new ZodNativeEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
    ...processCreateParams(params)
  });
};
class ZodPromise extends ZodType {
  unwrap() {
    return this._def.type;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.promise,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
    return OK(promisified.then((data) => {
      return this._def.type.parseAsync(data, {
        path: ctx.path,
        errorMap: ctx.common.contextualErrorMap
      });
    }));
  }
}
ZodPromise.create = (schema, params) => {
  return new ZodPromise({
    type: schema,
    typeName: ZodFirstPartyTypeKind.ZodPromise,
    ...processCreateParams(params)
  });
};
class ZodEffects extends ZodType {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const effect = this._def.effect || null;
    const checkCtx = {
      addIssue: (arg) => {
        addIssueToContext(ctx, arg);
        if (arg.fatal) {
          status.abort();
        } else {
          status.dirty();
        }
      },
      get path() {
        return ctx.path;
      }
    };
    checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
    if (effect.type === "preprocess") {
      const processed = effect.transform(ctx.data, checkCtx);
      if (ctx.common.async) {
        return Promise.resolve(processed).then(async (processed2) => {
          if (status.value === "aborted")
            return INVALID;
          const result = await this._def.schema._parseAsync({
            data: processed2,
            path: ctx.path,
            parent: ctx
          });
          if (result.status === "aborted")
            return INVALID;
          if (result.status === "dirty")
            return DIRTY(result.value);
          if (status.value === "dirty")
            return DIRTY(result.value);
          return result;
        });
      } else {
        if (status.value === "aborted")
          return INVALID;
        const result = this._def.schema._parseSync({
          data: processed,
          path: ctx.path,
          parent: ctx
        });
        if (result.status === "aborted")
          return INVALID;
        if (result.status === "dirty")
          return DIRTY(result.value);
        if (status.value === "dirty")
          return DIRTY(result.value);
        return result;
      }
    }
    if (effect.type === "refinement") {
      const executeRefinement = (acc) => {
        const result = effect.refinement(acc, checkCtx);
        if (ctx.common.async) {
          return Promise.resolve(result);
        }
        if (result instanceof Promise) {
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        }
        return acc;
      };
      if (ctx.common.async === false) {
        const inner = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inner.status === "aborted")
          return INVALID;
        if (inner.status === "dirty")
          status.dirty();
        executeRefinement(inner.value);
        return { status: status.value, value: inner.value };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
          if (inner.status === "aborted")
            return INVALID;
          if (inner.status === "dirty")
            status.dirty();
          return executeRefinement(inner.value).then(() => {
            return { status: status.value, value: inner.value };
          });
        });
      }
    }
    if (effect.type === "transform") {
      if (ctx.common.async === false) {
        const base = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (!isValid(base))
          return INVALID;
        const result = effect.transform(base.value, checkCtx);
        if (result instanceof Promise) {
          throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
        }
        return { status: status.value, value: result };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
          if (!isValid(base))
            return INVALID;
          return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
            status: status.value,
            value: result
          }));
        });
      }
    }
    util.assertNever(effect);
  }
}
ZodEffects.create = (schema, effect, params) => {
  return new ZodEffects({
    schema,
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    effect,
    ...processCreateParams(params)
  });
};
ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
  return new ZodEffects({
    schema,
    effect: { type: "preprocess", transform: preprocess },
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    ...processCreateParams(params)
  });
};
class ZodOptional extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.undefined) {
      return OK(void 0);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
}
ZodOptional.create = (type, params) => {
  return new ZodOptional({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodOptional,
    ...processCreateParams(params)
  });
};
class ZodNullable extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.null) {
      return OK(null);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
}
ZodNullable.create = (type, params) => {
  return new ZodNullable({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodNullable,
    ...processCreateParams(params)
  });
};
class ZodDefault extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    let data = ctx.data;
    if (ctx.parsedType === ZodParsedType.undefined) {
      data = this._def.defaultValue();
    }
    return this._def.innerType._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  removeDefault() {
    return this._def.innerType;
  }
}
ZodDefault.create = (type, params) => {
  return new ZodDefault({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodDefault,
    defaultValue: typeof params.default === "function" ? params.default : () => params.default,
    ...processCreateParams(params)
  });
};
class ZodCatch extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const newCtx = {
      ...ctx,
      common: {
        ...ctx.common,
        issues: []
      }
    };
    const result = this._def.innerType._parse({
      data: newCtx.data,
      path: newCtx.path,
      parent: {
        ...newCtx
      }
    });
    if (isAsync(result)) {
      return result.then((result2) => {
        return {
          status: "valid",
          value: result2.status === "valid" ? result2.value : this._def.catchValue({
            get error() {
              return new ZodError(newCtx.common.issues);
            },
            input: newCtx.data
          })
        };
      });
    } else {
      return {
        status: "valid",
        value: result.status === "valid" ? result.value : this._def.catchValue({
          get error() {
            return new ZodError(newCtx.common.issues);
          },
          input: newCtx.data
        })
      };
    }
  }
  removeCatch() {
    return this._def.innerType;
  }
}
ZodCatch.create = (type, params) => {
  return new ZodCatch({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodCatch,
    catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
    ...processCreateParams(params)
  });
};
class ZodNaN extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.nan) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.nan,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
}
ZodNaN.create = (params) => {
  return new ZodNaN({
    typeName: ZodFirstPartyTypeKind.ZodNaN,
    ...processCreateParams(params)
  });
};
class ZodBranded extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const data = ctx.data;
    return this._def.type._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  unwrap() {
    return this._def.type;
  }
}
class ZodPipeline extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.common.async) {
      const handleAsync = async () => {
        const inResult = await this._def.in._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inResult.status === "aborted")
          return INVALID;
        if (inResult.status === "dirty") {
          status.dirty();
          return DIRTY(inResult.value);
        } else {
          return this._def.out._parseAsync({
            data: inResult.value,
            path: ctx.path,
            parent: ctx
          });
        }
      };
      return handleAsync();
    } else {
      const inResult = this._def.in._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
      if (inResult.status === "aborted")
        return INVALID;
      if (inResult.status === "dirty") {
        status.dirty();
        return {
          status: "dirty",
          value: inResult.value
        };
      } else {
        return this._def.out._parseSync({
          data: inResult.value,
          path: ctx.path,
          parent: ctx
        });
      }
    }
  }
  static create(a, b) {
    return new ZodPipeline({
      in: a,
      out: b,
      typeName: ZodFirstPartyTypeKind.ZodPipeline
    });
  }
}
class ZodReadonly extends ZodType {
  _parse(input) {
    const result = this._def.innerType._parse(input);
    const freeze = (data) => {
      if (isValid(data)) {
        data.value = Object.freeze(data.value);
      }
      return data;
    };
    return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
  }
  unwrap() {
    return this._def.innerType;
  }
}
ZodReadonly.create = (type, params) => {
  return new ZodReadonly({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodReadonly,
    ...processCreateParams(params)
  });
};
var ZodFirstPartyTypeKind;
(function(ZodFirstPartyTypeKind2) {
  ZodFirstPartyTypeKind2["ZodString"] = "ZodString";
  ZodFirstPartyTypeKind2["ZodNumber"] = "ZodNumber";
  ZodFirstPartyTypeKind2["ZodNaN"] = "ZodNaN";
  ZodFirstPartyTypeKind2["ZodBigInt"] = "ZodBigInt";
  ZodFirstPartyTypeKind2["ZodBoolean"] = "ZodBoolean";
  ZodFirstPartyTypeKind2["ZodDate"] = "ZodDate";
  ZodFirstPartyTypeKind2["ZodSymbol"] = "ZodSymbol";
  ZodFirstPartyTypeKind2["ZodUndefined"] = "ZodUndefined";
  ZodFirstPartyTypeKind2["ZodNull"] = "ZodNull";
  ZodFirstPartyTypeKind2["ZodAny"] = "ZodAny";
  ZodFirstPartyTypeKind2["ZodUnknown"] = "ZodUnknown";
  ZodFirstPartyTypeKind2["ZodNever"] = "ZodNever";
  ZodFirstPartyTypeKind2["ZodVoid"] = "ZodVoid";
  ZodFirstPartyTypeKind2["ZodArray"] = "ZodArray";
  ZodFirstPartyTypeKind2["ZodObject"] = "ZodObject";
  ZodFirstPartyTypeKind2["ZodUnion"] = "ZodUnion";
  ZodFirstPartyTypeKind2["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
  ZodFirstPartyTypeKind2["ZodIntersection"] = "ZodIntersection";
  ZodFirstPartyTypeKind2["ZodTuple"] = "ZodTuple";
  ZodFirstPartyTypeKind2["ZodRecord"] = "ZodRecord";
  ZodFirstPartyTypeKind2["ZodMap"] = "ZodMap";
  ZodFirstPartyTypeKind2["ZodSet"] = "ZodSet";
  ZodFirstPartyTypeKind2["ZodFunction"] = "ZodFunction";
  ZodFirstPartyTypeKind2["ZodLazy"] = "ZodLazy";
  ZodFirstPartyTypeKind2["ZodLiteral"] = "ZodLiteral";
  ZodFirstPartyTypeKind2["ZodEnum"] = "ZodEnum";
  ZodFirstPartyTypeKind2["ZodEffects"] = "ZodEffects";
  ZodFirstPartyTypeKind2["ZodNativeEnum"] = "ZodNativeEnum";
  ZodFirstPartyTypeKind2["ZodOptional"] = "ZodOptional";
  ZodFirstPartyTypeKind2["ZodNullable"] = "ZodNullable";
  ZodFirstPartyTypeKind2["ZodDefault"] = "ZodDefault";
  ZodFirstPartyTypeKind2["ZodCatch"] = "ZodCatch";
  ZodFirstPartyTypeKind2["ZodPromise"] = "ZodPromise";
  ZodFirstPartyTypeKind2["ZodBranded"] = "ZodBranded";
  ZodFirstPartyTypeKind2["ZodPipeline"] = "ZodPipeline";
  ZodFirstPartyTypeKind2["ZodReadonly"] = "ZodReadonly";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
const stringType = ZodString.create;
const numberType = ZodNumber.create;
const unknownType = ZodUnknown.create;
ZodNever.create;
const arrayType = ZodArray.create;
const objectType = ZodObject.create;
const unionType = ZodUnion.create;
ZodIntersection.create;
const tupleType = ZodTuple.create;
const recordType = ZodRecord.create;
ZodEnum.create;
ZodPromise.create;
ZodOptional.create;
ZodNullable.create;
const operationIdSchema = stringType();
const testCaseIdSchema = stringType();
const httpStatusSchema = numberType().nullable();
const testFilePathSchema = stringType();
const testCaseSchema = recordType(unknownType()).and(
  objectType({
    id: testCaseIdSchema.optional(),
    filePath: testFilePathSchema.optional(),
    name: stringType().optional(),
    startLine: numberType().optional(),
    endLine: numberType().optional(),
    namedExamples: arrayType(stringType()).optional().nullable()
  })
);
const warningSchema = recordType(unknownType()).and(
  objectType({
    message: stringType().optional(),
    category: stringType().optional(),
    displayPriority: numberType().optional()
  })
);
const faultCategoryIdSchema = recordType(unknownType()).and(
  objectType({
    id: stringType(),
    code: unionType([numberType(), numberType(), numberType(), numberType()]).and(numberType()),
    context: stringType().optional().nullable()
  })
);
const coveredEndpointSchema = recordType(unknownType()).and(
  objectType({
    endpointId: operationIdSchema,
    testCaseId: testCaseIdSchema,
    httpStatus: arrayType(httpStatusSchema).nullable()
  })
);
const coverageCriterionSchema = recordType(unknownType()).and(
  objectType({
    name: stringType(),
    covered: numberType(),
    total: numberType().optional().nullable()
  })
);
const rESTReportSchema = recordType(unknownType()).and(
  objectType({
    outputHttpCalls: numberType(),
    evaluatedHttpCalls: numberType(),
    endpointIds: arrayType(operationIdSchema),
    coveredHttpStatus: arrayType(coveredEndpointSchema)
  })
);
const coverageSchema = recordType(unknownType()).and(
  objectType({
    toolName: stringType(),
    criteria: arrayType(coverageCriterionSchema)
  })
);
const foundFaultSchema = recordType(unknownType()).and(
  objectType({
    operationId: operationIdSchema,
    testCaseId: testCaseIdSchema,
    faultCategories: tupleType([faultCategoryIdSchema]).rest(faultCategoryIdSchema)
  })
);
const faultsSchema = recordType(unknownType()).and(
  objectType({
    totalNumber: numberType(),
    foundFaults: arrayType(foundFaultSchema)
  })
);
const webFuzzingCommonsReportSchema = recordType(unknownType()).and(
  objectType({
    schemaVersion: stringType(),
    toolName: stringType(),
    toolVersion: stringType(),
    creationTime: stringType(),
    faults: faultsSchema,
    problemDetails: recordType(unknownType()).and(
      objectType({
        rest: rESTReportSchema.optional()
      })
    ),
    totalTests: numberType(),
    testFilePaths: arrayType(testFilePathSchema),
    testCases: arrayType(testCaseSchema),
    executionTimeInSeconds: numberType(),
    extra: arrayType(coverageSchema).optional().nullable(),
    warnings: arrayType(warningSchema).optional().nullable()
  })
);
const faultCategories = /* @__PURE__ */ JSON.parse(`[{"code":100,"descriptiveName":"HTTP Status 500","fullDescription":"The HTTP status code 500 represents a 'Server Error'. Typically, when there is crash in the business logic of the tested backend, like for example due to a null-pointer exception, the server would not crash, but rather return a response with status code 500. Therefore, the presence of such a response 'might' indicate the presence of a fault in the backend. However, such code might also be used for other cases that have nothing to do with software faults. For example, if a request cannot be handled due to issue with the environment, e.g., databases and  communications with other APIs, a status code 500 could be sent. As such, although there is high chances that a 500 status code might point to the presence of a software fault in the tested application, they still need to be manually checked due to possible 'false-positive'.","group":"G_1XX","id":"HTTP_STATUS_500","label":"F100:HTTP Status 500","testCaseLabel":"causes500_internalServerError"},{"code":101,"descriptiveName":"HTTP Violation: no-non-standard-codes","fullDescription":"HTTP status codes outside the range 100-599 are not valid.","group":"G_1XX","id":"HTTP_STATUS_NO_NON_STANDARD_CODES","label":"F101:HTTP Violation: no-non-standard-codes","testCaseLabel":"invalidStatusCode"},{"code":102,"descriptiveName":"HTTP Violation: no-201-if-delete","fullDescription":"A DELETE operation is meant to remove a resource, and so it should not states to 201 create one.","group":"G_1XX","id":"HTTP_STATUS_NO_201_IF_DELETE","label":"F102:HTTP Violation: no-201-if-delete","testCaseLabel":"201OnDelete"},{"code":103,"descriptiveName":"HTTP Violation: no-201-if-get","fullDescription":"A GET operation is meant to retrieve a resource, and so it should not states to 201 create one.","group":"G_1XX","id":"HTTP_STATUS_NO_201_IF_GET","label":"F103:HTTP Violation: no-201-if-get","testCaseLabel":"201OnGet"},{"code":104,"descriptiveName":"HTTP Violation: no-201-if-patch","fullDescription":"A PATCH operation is meant to modify a resource, and so it should not states to 201 create one.","group":"G_1XX","id":"HTTP_STATUS_NO_201_IF_PATCH","label":"F104:HTTP Violation: no-201-if-patch","testCaseLabel":"201OnPatch"},{"code":105,"descriptiveName":"HTTP Violation: no-204-if-content","fullDescription":"If a response contains a payload, it should not state it 204 contains none.","group":"G_1XX","id":"HTTP_STATUS_NO_204_IF_CONTENT","label":"F105:HTTP Violation: no-204-if-content","testCaseLabel":"204WhenContent"},{"code":106,"descriptiveName":"HTTP Violation: no-413-if-no-payload","fullDescription":"Cannot state a payload is too large if there is no payload.","group":"G_1XX","id":"HTTP_STATUS_NO_413_IF_NO_PAYLOAD","label":"F106:HTTP Violation: no-413-if-no-payload","testCaseLabel":"413WhenNoPayload"},{"code":107,"descriptiveName":"HTTP Violation: no-415-if-no-payload","fullDescription":"Cannot state a payload is of the wrong type if there is no payload.","group":"G_1XX","id":"HTTP_STATUS_NO_415_IF_NO_PAYLOAD","label":"F107:HTTP Violation: no-415-if-no-payload","testCaseLabel":"415WhenNoPayload"},{"code":108,"descriptiveName":"HTTP Violation: no-304-if-no-get-or-head","fullDescription":"A 304 response is not valid if the request was not either a GET or a HEAD.","group":"G_1XX","id":"HTTP_STATUS_NO_304_IF_NO_GET_OR_HEAD","label":"F108:HTTP Violation: no-304-if-no-get-or-head","testCaseLabel":"304OnWrongVerb"},{"code":109,"descriptiveName":"HTTP Violation: no-401-if-no-authenticate","fullDescription":"If an API responds with a 401 non-authenticated error, such response MUST contain a www-authenticate header, with the needed information. In HTTP, this is not optional.","group":"G_1XX","id":"HTTP_STATUS_NO_401_IF_NO_WWW_AUTHENTICATE","label":"F109:HTTP Violation: no-401-if-no-authenticate","testCaseLabel":"401MissingWwwAuthenticate"},{"code":110,"descriptiveName":"HTTP Violation: no-405-if-no-allow","fullDescription":"A 405 Not Allowed response must contain an Allow header specifying what is allowed.","group":"G_1XX","id":"HTTP_STATUS_NO_405_IF_NO_ALLOW","label":"F110:HTTP Violation: no-405-if-no-allow","testCaseLabel":"405MissingAllow"},{"code":111,"descriptiveName":"HTTP Violation: no-205-if-content","fullDescription":"If a response contains a payload, it should not return a 205, as that requires no payload.","group":"G_1XX","id":"HTTP_STATUS_NO_205_IF_CONTENT","label":"F111:HTTP Violation: no-205-if-content","testCaseLabel":"205WhenContent"},{"code":112,"descriptiveName":"HTTP Violation: no-426-if-no-upgrade","fullDescription":"A 426 response must contain an Upgrade header with the needed information.","group":"G_1XX","id":"HTTP_STATUS_NO_426_IF_NO_UPGRADE","label":"F112:HTTP Violation: no-426-if-no-upgrade","testCaseLabel":"426MissingUpgrade"},{"code":113,"descriptiveName":"HTTP Violation: Resource Still Accessible After Successful DELETE","fullDescription":"If a resource is deleted, and the API responds that such request was successful, then such resource should no longer being available. New requests to access it should fail. Otherwise, if it is still possible to access the resource, then it was not really deleted. Then, as such, it means that the delete operation is faulty.","group":"G_1XX","id":"HTTP_NONWORKING_DELETE","label":"F113:HTTP Violation: Resource Still Accessible After Successful DELETE","testCaseLabel":"deleteDoesNotWork"},{"code":114,"descriptiveName":"HTTP Violation: A Failed PUT or PATCH Must Not Change The Resource","fullDescription":"Write operations that fail due to user errors should not leave side effects on the system. There should not be partial updates: either all are applied, or none.","group":"G_1XX","id":"HTTP_SIDE_EFFECTS_FAILED_MODIFICATION","label":"F114:HTTP Violation: A Failed PUT or PATCH Must Not Change The Resource","testCaseLabel":"sideEffectsFailedModification"},{"code":115,"descriptiveName":"HTTP Violation: Repeated PUT Creates Resource With 201 Instead of Updating","fullDescription":"A PUT operation can either update (e.g., 200 or 204) or create (201) a resource. If a resource is 201 created with a PUT, a second PUT should update the resource, and not be marked as recreated.","group":"G_1XX","id":"HTTP_REPEATED_CREATE_PUT","label":"F115:HTTP Violation: Repeated PUT Creates Resource With 201 Instead of Updating","testCaseLabel":"repeatedCreatePut"},{"code":116,"descriptiveName":"HTTP Violation: Misleading PUT 201 Creates When Resource Already Exists","fullDescription":"A PUT operation can either update (e.g., 200 or 204) or create (201) a resource. If a resource already exists, than a PUT operation on it would update it, and not create it.","group":"G_1XX","id":"HTTP_MISLEADING_CREATE_PUT","label":"F116:HTTP Violation: Misleading PUT 201 Creates When Resource Already Exists","testCaseLabel":"misleadingCreatePut"},{"code":117,"descriptiveName":"HTTP Violation: The Verb PUT Must Make a Full Replacement","fullDescription":"A PUT operation is used to make a full replacement of a resource","group":"G_1XX","id":"HTTP_PARTIAL_UPDATE_PUT","label":"F117:HTTP Violation: The Verb PUT Must Make a Full Replacement","testCaseLabel":"partialUpdatePut"},{"code":118,"descriptiveName":"HTTP Violation: PUT Implementation Must be Idempotent","fullDescription":"A PUT operation is treated as idempotent. A write operation with a PUT that is not implemented as idempotent might have severe repercussions, as such operation could be automatically repeated any entity involved in the HTTP connection without any warning to the user.","group":"G_1XX","id":"HTTP_NON_IDEMPOTENT_PUT","label":"F118:HTTP Violation: PUT Implementation Must be Idempotent","testCaseLabel":"nonIdempotentPut"},{"code":119,"descriptiveName":"HTTP Violation: Invalid JSON Merge Patch","fullDescription":"A JSON Merge Path has a specific semantics, defining how values are modified based on the input payloads. Modifying entries not specified in the payload would be a clear implementation fault.","group":"G_1XX","id":"HTTP_INVALID_MERGE_PATCH","label":"F119:HTTP Violation: Invalid JSON Merge Patch","testCaseLabel":"invalidMergePatch"},{"code":120,"descriptiveName":"HTTP Violation: Invalid Location HTTP Header","fullDescription":"Even outside of 3xx redirections, the Location header can be used to specify for example where newly created resources can be accessed. However, if a Location value point to a path for which there is no valid operation (not necessarily a GET) in the API, then such value might be likely wrong.","group":"G_1XX","id":"HTTP_INVALID_LOCATION","label":"F120:HTTP Violation: Invalid Location HTTP Header","testCaseLabel":"returnsInvalidLocationHeader"},{"code":121,"descriptiveName":"HTTP Status 5xx Other Than 500 And 501","fullDescription":"Status codes in the 5xx range represent server-side errors. Apart from 500 and 501, any other 5xx code (e.g., 502, 503 and 504) might indicate faults in the tested application, or in how it deals with the services it depends on. Like 500, these codes need a manual check: the environment can cause them (e.g., a temporarily unavailable database).","group":"G_1XX","id":"HTTP_OTHER_STATUS_5XX","label":"F121:HTTP Status 5xx Other Than 500 And 501","testCaseLabel":"causes5xx_serverError"},{"code":122,"descriptiveName":"HTTP Violation: Resource Not Found Right After Successful Creation","fullDescription":"If a resource is successfully created (e.g., with a POST), then it should be possible to access it right after. If a request on the new resource (e.g., using the identifier returned in the creation response) gives a 404, and nobody deleted it, then either the resource was not created, or the API returns wrong information about how to access it.","group":"G_1XX","id":"HTTP_CREATED_RESOURCE_NOT_FOUND","label":"F122:HTTP Violation: Resource Not Found Right After Successful Creation","testCaseLabel":"createdResourceNotFound"},{"code":123,"descriptiveName":"HTTP Violation: Read Operation Broken After Fuzzing","fullDescription":"If a GET operation on an endpoint succeeded before fuzzing, repeating the same valid GET request after fuzzing write operations (e.g., POST, PUT and PATCH) on that path should not fail with a 5xx server error. A server error at this point suggests that a fuzzed write operation stored corrupted data that now breaks subsequent reads.","group":"G_1XX","id":"HTTP_BROKEN_READ","label":"F123:HTTP Violation: Read Operation Broken After Fuzzing","testCaseLabel":"readBrokenAfterFuzzing"},{"code":124,"descriptiveName":"HTTP Violation: Updated Resource State Not Reflected On Subsequent Read","fullDescription":"If a resource is successfully updated (e.g., with a PUT or PATCH returning a 2xx status code), reading the resource back with a GET right after should reflect the updated writable fields. If the comparable fields still have their old values or differ from what was sent in the update, the update was silently ignored or not persisted properly.","group":"G_1XX","id":"HTTP_UPDATE_READ_INCONSISTENCY","label":"F124:HTTP Violation: Updated Resource State Not Reflected On Subsequent Read","testCaseLabel":"updateReadInconsistency"},{"code":125,"descriptiveName":"HTTP Violation: Update With Stale ETag Precondition Accepted","fullDescription":"Optimistic concurrency control in HTTP uses ETags and the If-Match header to prevent lost updates. If a resource is modified so that its ETag changes, a subsequent write request (e.g., PUT or PATCH) carrying the old, stale If-Match ETag should be rejected (typically with 412 Precondition Failed), rather than succeeding and overwriting the newer state.","group":"G_1XX","id":"HTTP_STALE_ETAG_ACCEPTED","label":"F125:HTTP Violation: Update With Stale ETag Precondition Accepted","testCaseLabel":"staleEtagAccepted"},{"code":200,"descriptiveName":"Schema Violation: Received A Response From API With A Structure/Data That Is Not Matching Its Schema","fullDescription":"A schema, like for example OpenAPI for REST, defines the structures not only of the inputs but also the outputs of the API. If what returned by an API is not conforming to its schema, then it is a clear fault. However, whether the fault is in the API (i.e., it does not conform to the schema) or in the schema itself (i.e., it is underspecified, or having mistakes) is something that cannot be known for sure without debugging the issue.","group":"G_2XX","id":"SCHEMA_INVALID_RESPONSE","label":"F200:Schema Violation: Received A Response From API With A Structure/Data That Is Not Matching Its Schema","testCaseLabel":"returnsMismatchResponseWithSchema"},{"code":201,"descriptiveName":"Schema Violation: Invalid Allow HTTP Header","fullDescription":"A returned Allow header specifies what operations (e.g., GET and PATCH) are available on a resource. For consistency, this needs to match what actually defined in the schema of the API, apart from special cases such as HEAD and OPTIONS.","group":"G_2XX","id":"SCHEMA_INVALID_ALLOW","label":"F201:Schema Violation: Invalid Allow HTTP Header","testCaseLabel":"invalidAllow"},{"code":202,"descriptiveName":"Schema Violation: no-401-if-no-auth","fullDescription":"Should not return a 401 non-authenticated if there is no authentication in the definition of the API (or conversely, authentication definition is wrongly missing).","group":"G_2XX","id":"SCHEMA_STATUS_NO_401_IF_NO_AUTH","label":"F202:Schema Violation: no-401-if-no-auth","testCaseLabel":"401WhenNoAuth"},{"code":203,"descriptiveName":"Schema Violation: no-403-if-no-401","fullDescription":"Should not return a 403 non-authorized if there is no 401 non-authenticated in the definition of the API (or conversely, such definition is wrongly missing).","group":"G_2XX","id":"SCHEMA_STATUS_NO_403_IF_NO_401","label":"F203:Schema Violation: no-403-if-no-401","testCaseLabel":"403WhenNo401"},{"code":204,"descriptiveName":"Schema Violation: has-406-if-accept","fullDescription":"If a valid payload is sent based on what declared in the schema, it should not happen that the API responds with a 406 non-valid payload type.","group":"G_2XX","id":"SCHEMA_STATUS_HAS_406_IF_ACCEPT","label":"F204:Schema Violation: has-406-if-accept","testCaseLabel":"406WhenValid"},{"code":205,"descriptiveName":"Schema Violation: no-501-if-implemented","fullDescription":"If a schema defines an endpoint, then a call on it should not return a 501 Non-Implemented.","group":"G_2XX","id":"SCHEMA_STATUS_NO_501_IF_IMPLEMENTED","label":"F205:Schema Violation: no-501-if-implemented","testCaseLabel":"501OnDeclaredEndpoint"},{"code":206,"descriptiveName":"Received Success Response When Sending Wrong Data","fullDescription":"API inputs might have constraints (e.g., integers in a specific range, and strings matching a given regular expression). Also, they need be to of specific types (e.g., integers, booleans, strings, dates, arrays and objects). If some input data does not satisfy the type on constraints defined in the schema, then the API should mark the request as 'user error'. However, if for any reason the request is processed successfully, then it is a fault. Either the schema is incorrect, or the API is not properly discarding invalid data.","group":"G_2XX","id":"SCHEMA_VALIDATION_BYPASS","label":"F206:Received Success Response When Sending Wrong Data","testCaseLabel":"successOnInvalidInputs"},{"code":207,"descriptiveName":"Received User Error Response When Sending Valid Data","fullDescription":"The converse of 'Received Success Response When Sending Wrong Data'. If all input data satisfies the types and constraints defined in the schema, then the API should not mark the request as 'user error' (e.g., with a 400 or 422 in REST). Status codes that do not depend on data validity, like 401, 403, 404, 409 and 429, are not considered here. Either the schema is incorrect (e.g., it is missing some constraints), or the API rejects valid data. As OpenAPI is not able to express all possible types of input constraints (e.g., inter-parameter dependencies), depending on the API this oracle might lead to some false positives.","group":"G_2XX","id":"SCHEMA_VALID_INPUT_REJECTED","label":"F207:Received User Error Response When Sending Valid Data","testCaseLabel":"rejectedValidInputs"},{"code":300,"descriptiveName":"SQL Injection (SQLi)","fullDescription":"Input data was not properly sanitized. Its use in SQL commands led to execute arbitrary commands on the database. See OWASP Top 10 for more information.","group":"G_3XX","id":"SECURITY_SQL_INJECTION","label":"F300:SQL Injection (SQLi)","testCaseLabel":"vulnerableToSQLInjection"},{"code":301,"descriptiveName":"Cross-Site Scripting (XSS)","fullDescription":"XSS is an attack in which it is possible to inject malicious scripts into web pages viewed users. This works as well in APIs, if the malicious payload is stored as it is, and then read afterwards by a frontend web application. See OWASP Top 10 for more information.","group":"G_3XX","id":"SECURITY_XSS_INJECTION","label":"F301:Cross-Site Scripting (XSS)","testCaseLabel":"vulnerableToXSS"},{"code":302,"descriptiveName":"Server-Side Request Forgery (SSRF)","fullDescription":"Some inputs might be URLs, which are then used by the API to retrieve data from external services. However, if the hostnames of these URLs are not verified, the API could be tricked into making requests towards servers it should not to, like for example the 'localhost'. See OWASP Top 10 for more information.","group":"G_3XX","id":"SECURITY_SSRF","label":"F302:Server-Side Request Forgery (SSRF)","testCaseLabel":"vulnerableToSSRF"},{"code":303,"descriptiveName":"Mass Assignment","fullDescription":"This vulnerability exploits possible active record pattern misconfigurations to modify fields of  a record that should not be accessible via the API. See OWASP Top 10 for more information.","group":"G_3XX","id":"SECURITY_MASS_ASSIGNMENT","label":"F303:Mass Assignment","testCaseLabel":"vulnerableToMassAssignment"},{"code":304,"descriptiveName":"Leakage Information Existence of Protected Resource","fullDescription":"When accessing a protected resource, could get as a response a 403 not-authorized status code. If the resource does not exist, then returning a 404 would be a security leak, as now the client would know if resources, they have no access to, do exist or not. In these cases, to avoid unauthorized information leakage, a server should consistently either always return 403 or 404 for protected resources, regardless of whether they exist or not.","group":"G_3XX","id":"SECURITY_EXISTENCE_LEAKAGE","label":"F304:Leakage Information Existence of Protected Resource","testCaseLabel":"allowsUnauthorizedAccessToProtectedResource"},{"code":305,"descriptiveName":"Wrongly Not Recognized as Authenticated","fullDescription":"If the user is providing valid credentials, and if they try to access a protected resource, they should get a status code 403 (not authorized), and not 401 (not authenticated). With a 401, the user might wrongly think there is a problem with their credentials, and not that they have no right to access to that resource. However, to avoid false positives related to misconfigured credentials, these credentials should be first successfully validated on some other resources before flagging a returned 401 as a server fault.","group":"G_3XX","id":"SECURITY_NOT_RECOGNIZED_AUTHENTICATED","label":"F305:Wrongly Not Recognized as Authenticated","testCaseLabel":"authenticatedButWronglyToldNot"},{"code":306,"descriptiveName":"Allowed To Modify Resource That Likely Should Had Been Protected","fullDescription":"BOLA and BFLA are major security vulnerabilities. To avoid users accessing protected resources, authorization mechanisms are usually put in place. However, it can happen that, on some endpoints, these authorization mechanisms are missing or misconfigured by mistake. This can have disastrous consequences, e.g., a regular user deleting all data from all other users. However, access policies could be arbitrarily complex, where some users might validly interact with some resources of other users. A common example is 'administrator' users. Without a formal specification describing in details the access policies in place, it is hard to say automatically if we are in the case of a BOLA/BFLA vulnerability. Still, some heuristics could be used to flag highly suspicious cases. For example, if a user is blocked with a 403 to do a PUT and a PATCH on a resource, it would be quite suspicious if a DELETE would work just fine on that resource.","group":"G_3XX","id":"SECURITY_INCONSISTENT_WRITE_AUTHORIZATION","label":"F306:Allowed To Modify Resource That Likely Should Had Been Protected","testCaseLabel":"missedAuthorizationCheck"},{"code":307,"descriptiveName":"A Protected Resource Is Accessible Without Providing Any Authentication","fullDescription":"Protected resources would return a 403 status code when a user that has no rights to them tries to access them. Without providing a formal specification, it might not be possible to know which users have rights or not on a resource. However, being able to access it with no authentication, while some authenticated users are blocked, would be a major security vulnerability. Blocked users could simply drop their authentication credentials to access those protected resources.","group":"G_3XX","id":"SECURITY_IGNORE_ANONYMOUS","label":"F307:A Protected Resource Is Accessible Without Providing Any Authentication","testCaseLabel":"ignoreAnonymous"},{"code":308,"descriptiveName":"Anonymous Modifications","fullDescription":"Not all systems require authentication when reading data, or creating new ones. Without a formal specification, a fuzzer cannot know if a resource is expected to be public or not. However, 'modifying' data (e.g., with DELETE, PUT and PATCH) with no credentials is problematic.  A user could delete all existing data, or change any new data as soon as it is created by others.","group":"G_3XX","id":"SECURITY_ANONYMOUS_MODIFICATIONS","label":"F308:Anonymous Modifications","testCaseLabel":"anonymousModifications"},{"code":309,"descriptiveName":"Leaked Stack Trace","fullDescription":"In case of bugs, the internal business logic of the tested application could throw exceptions. For debugging reasons, the responses from the HTTP server could contain the stack-trace of those thrown exceptions. Albeit useful for debugging, those stack-traces could reveal internal details of the system. This would be a security leak if those debugging settings are left in production.","group":"G_3XX","id":"SECURITY_LEAKED_STACK_TRACES","label":"F309:Leaked Stack Trace","testCaseLabel":"leakedStackTrace"},{"code":310,"descriptiveName":"Hidden Accessible Endpoint","fullDescription":"To test an API, there is the need of a schema that specifies what endpoints can be called. Being able to call endpoints that are not declared in the schema is a potential risk, as those might be either forgotten endpoints, work-in-progress, admin-only endpoints, etc., whose security protections might not be fully tested or in place. Either the call should fail for auth reasons (e.g., 401 and 403 in REST APIs), or the system should respond that the endpoint does not exist (e.g., 405 and 501).","group":"G_3XX","id":"SECURITY_HIDDEN_ACCESSIBLE_ENDPOINT","label":"F310:Hidden Accessible Endpoint","testCaseLabel":"hiddenAccessible"},{"code":311,"descriptiveName":"Declared Authentication Is Not Enforced","fullDescription":"A schema can declare that an operation requires authentication (e.g., with security requirements in OpenAPI). If a request with valid credentials succeeds, then the same request with no credentials, or with invalid ones, should be rejected (e.g., with a 401 or 403 in REST). Otherwise, either the schema declares authentication by mistake, or the API does not enforce it. Modifications (e.g., DELETE, PUT and PATCH) accepted with no credentials are handled in 'Anonymous Modifications'; this code covers all other cases, including reads and invalid credentials.","group":"G_3XX","id":"SECURITY_DECLARED_AUTH_NOT_ENFORCED","label":"F311:Declared Authentication Is Not Enforced","testCaseLabel":"declaredAuthNotEnforced"},{"code":312,"descriptiveName":"Call Timeout","fullDescription":"A call that does not get a response within a given time limit, or never gets one, might point to a denial-of-service vulnerability: specific inputs make the API spend excessive time (or resources) handling the request. An attacker could send such requests repeatedly to make the API unavailable to other users. The environment can also cause slow responses (e.g., an overloaded server or a slow database), so these calls need a manual check. The time limit should match the expected performance of the API.","group":"G_3XX","id":"SECURITY_CALL_TIMEOUT","label":"F312:Call Timeout","testCaseLabel":"callTimeout"},{"code":313,"descriptiveName":"Command Injection (OS Command Execution)","fullDescription":"Input data was not properly sanitized. Its use in system shell or process execution calls led to executing arbitrary OS commands on the server. See OWASP Top 10 for more information.","group":"G_3XX","id":"SECURITY_COMMAND_INJECTION","label":"F313:Command Injection (OS Command Execution)","testCaseLabel":"vulnerableToCommandInjection"},{"code":314,"descriptiveName":"NoSQL Injection (NoSQLi)","fullDescription":"Input data was not properly sanitized. Its use in NoSQL queries (e.g., MongoDB operators such as $ne, $gt and $where) led to unauthorized query manipulation or server-side script evaluation. See OWASP Top 10 for more information.","group":"G_3XX","id":"SECURITY_NOSQL_INJECTION","label":"F314:NoSQL Injection (NoSQLi)","testCaseLabel":"vulnerableToNoSQLInjection"},{"code":315,"descriptiveName":"Excessive Data Exposure","fullDescription":"An API response exposed sensitive data that should not be returned to the client, such as fields marked as writeOnly in the schema or unmasked credentials, secrets and personal identifiers. See OWASP API Security Top 10 for more information.","group":"G_3XX","id":"SECURITY_EXCESSIVE_DATA_EXPOSURE","label":"F315:Excessive Data Exposure","testCaseLabel":"excessiveDataExposure"},{"code":316,"descriptiveName":"Missing Security Headers","fullDescription":"The HTTP response omitted standard security headers (such as X-Content-Type-Options, X-Frame-Options, Content-Security-Policy or Cache-Control for sensitive responses) that harden clients against MIME sniffing, framing and caching attacks.","group":"G_3XX","id":"SECURITY_MISSING_HEADERS","label":"F316:Missing Security Headers","testCaseLabel":"missingSecurityHeaders"},{"code":317,"descriptiveName":"LDAP Injection","fullDescription":"Input data was not properly sanitized. Its use in LDAP queries led to unauthorized query manipulation, such as altering filters (e.g., via unescaped characters like '(', ')' and '*') to bypass authentication or extract directory data beyond what was intended. See OWASP Top 10 for more information.","group":"G_3XX","id":"SECURITY_LDAP_INJECTION","label":"F317:LDAP Injection","testCaseLabel":"vulnerableToLDAPInjection"}]`);
const getFaultCategoryInfo = (code2) => {
  const found = faultCategories.find((f) => f.code === code2);
  if (found) {
    return { id: found.id, code: code2, name: found.descriptiveName, label: found.label, description: found.fullDescription };
  }
  const name = code2 >= 900 && code2 <= 999 ? "Custom Code" : "Unrecognized Code";
  return { id: null, code: code2, name, label: `F${code2}:${name}`, description: null };
};
const NO_RESPONSE_CODE = -1;
const byNumber = (a, b) => a - b;
const statusGroupOf = (code2) => {
  if (code2 === null) return "NO_RESPONSE";
  if (code2 >= 200 && code2 < 300) return "2XX";
  if (code2 >= 300 && code2 < 400) return "3XX";
  if (code2 >= 400 && code2 < 500) return "4XX";
  if (code2 >= 500 && code2 < 600) return "5XX";
  return null;
};
const buildStatusCoverage = (endpointIds, covered) => {
  const declared = new Set(endpointIds);
  const groups = /* @__PURE__ */ new Map();
  for (const ce of covered) {
    if (!declared.has(ce.endpointId)) continue;
    const endpointGroups = groups.get(ce.endpointId) ?? /* @__PURE__ */ new Set();
    const codes = ce.httpStatus && ce.httpStatus.length > 0 ? ce.httpStatus : [null];
    for (const c of codes) {
      const group = statusGroupOf(c);
      if (group) endpointGroups.add(group);
    }
    groups.set(ce.endpointId, endpointGroups);
  }
  const counts = { "NO_RESPONSE": 0, "2XX": 0, "3XX": 0, "4XX": 0, "5XX": 0 };
  for (const endpointGroups of groups.values()) {
    endpointGroups.forEach((g) => counts[g]++);
  }
  return { total: endpointIds.length, counts };
};
const buildEndpoints = (report) => {
  const rest = report.problemDetails?.rest;
  if (!rest) return [];
  const rows = /* @__PURE__ */ new Map();
  const rowOf = (endpoint, declared) => {
    let row = rows.get(endpoint);
    if (!row) {
      row = { declared, statusCodes: /* @__PURE__ */ new Set(), faultCodes: /* @__PURE__ */ new Set(), tests: /* @__PURE__ */ new Set() };
      rows.set(endpoint, row);
    }
    return row;
  };
  rest.endpointIds.forEach((id) => rowOf(id, true));
  for (const ff of report.faults.foundFaults) {
    if (!ff.operationId) continue;
    const row = rowOf(ff.operationId, false);
    ff.faultCategories.forEach((fc) => row.faultCodes.add(fc.code));
    row.tests.add(ff.testCaseId);
  }
  for (const ce of rest.coveredHttpStatus) {
    const row = rows.get(ce.endpointId);
    if (!row) continue;
    const codes = ce.httpStatus && ce.httpStatus.length > 0 ? ce.httpStatus : [null];
    codes.forEach((c) => row.statusCodes.add(c ?? NO_RESPONSE_CODE));
    row.tests.add(ce.testCaseId);
  }
  return [...rows.entries()].map(([endpoint, row]) => ({
    endpoint,
    declared: row.declared,
    statusCodes: [...row.statusCodes].sort(byNumber),
    faultCodes: [...row.faultCodes].sort(byNumber),
    testCaseIds: [...row.tests].sort()
  }));
};
const buildFaultDetails = (report) => {
  const details2 = /* @__PURE__ */ new Map();
  for (const ff of report.faults.foundFaults) {
    const operationId = ff.operationId ?? "(unknown operation)";
    for (const fc of ff.faultCategories) {
      const context = fc.context ?? null;
      const key = JSON.stringify([operationId, fc.code, context]);
      let entry = details2.get(key);
      if (!entry) {
        const info = getFaultCategoryInfo(fc.code);
        entry = {
          detail: { operationId, id: fc.id ?? info.id, code: fc.code, name: info.name, context, testCaseIds: [] },
          tests: /* @__PURE__ */ new Set()
        };
        details2.set(key, entry);
      }
      entry.tests.add(ff.testCaseId);
    }
  }
  return [...details2.values()].map(({ detail, tests }) => ({ ...detail, testCaseIds: [...tests] })).sort((a, b) => a.code - b.code || a.operationId.localeCompare(b.operationId) || (a.context ?? "").localeCompare(b.context ?? ""));
};
const buildFaultGroups = (details2, declaredIds) => {
  const groups = /* @__PURE__ */ new Map();
  for (const d of details2) {
    let group = groups.get(d.code);
    if (!group) {
      group = { id: d.id, name: d.name, rows: /* @__PURE__ */ new Map() };
      groups.set(d.code, group);
    }
    let entry = group.rows.get(d.operationId);
    if (!entry) {
      entry = {
        row: {
          operationId: d.operationId,
          declared: declaredIds === null || declaredIds.has(d.operationId),
          faults: 0,
          example: null,
          testCaseIds: []
        },
        tests: /* @__PURE__ */ new Set()
      };
      group.rows.set(d.operationId, entry);
    }
    entry.row.faults++;
    if (entry.row.example === null && d.context !== null) entry.row.example = d.context;
    d.testCaseIds.forEach((id) => entry.tests.add(id));
  }
  return [...groups.entries()].map(([code2, group]) => {
    const rows = [...group.rows.values()].map(({ row, tests }) => ({ ...row, testCaseIds: [...tests] })).sort((a, b) => b.faults - a.faults || a.operationId.localeCompare(b.operationId));
    return { id: group.id, code: code2, name: group.name, faults: rows.reduce((sum, r) => sum + r.faults, 0), operations: rows.length, rows };
  });
};
const buildFaultCategories = (groups) => groups.map((g) => {
  const info = getFaultCategoryInfo(g.code);
  const undeclared = g.rows.filter((r) => !r.declared).length;
  return {
    id: g.id,
    code: g.code,
    name: info.name,
    label: info.label,
    count: g.faults,
    operationCount: g.operations - undeclared,
    undeclaredOperationCount: undeclared
  };
});
const buildWarnings = (report) => (report.warnings ?? []).map((w) => ({ message: w.message ?? "", category: w.category ?? null, displayPriority: w.displayPriority ?? null })).sort((a, b) => (a.displayPriority ?? Number.MAX_SAFE_INTEGER) - (b.displayPriority ?? Number.MAX_SAFE_INTEGER));
const buildNamedExamples = (report) => {
  const examples = /* @__PURE__ */ new Map();
  for (const tc of report.testCases) {
    const id = tc.id ?? tc.name ?? "";
    for (const example of tc.namedExamples ?? []) {
      if (!example) continue;
      const ids = examples.get(example) ?? /* @__PURE__ */ new Set();
      ids.add(id);
      examples.set(example, ids);
    }
  }
  return [...examples.entries()].map(([name, ids]) => ({ name, testCaseIds: [...ids] })).sort((a, b) => a.name.localeCompare(b.name));
};
const buildSummaryModel = (report) => {
  const rest = report.problemDetails?.rest;
  const endpointIds = rest?.endpointIds ?? [];
  const faultyTestIds = new Set(report.faults.foundFaults.map((ff) => ff.testCaseId));
  const faultDetails = buildFaultDetails(report);
  const faultGroups = buildFaultGroups(faultDetails, rest ? new Set(endpointIds) : null);
  const faultCategories2 = buildFaultCategories(faultGroups);
  return {
    toolName: report.toolName,
    toolVersion: report.toolVersion,
    schemaVersion: report.schemaVersion,
    creationTime: report.creationTime,
    executionTimeInSeconds: report.executionTimeInSeconds,
    totals: {
      endpoints: rest ? endpointIds.length : null,
      testFiles: report.testFilePaths.length,
      testCases: report.testCases.length,
      outputHttpCalls: rest ? rest.outputHttpCalls : null,
      evaluatedHttpCalls: rest ? rest.evaluatedHttpCalls : null,
      faults: report.faults.totalNumber,
      distinctFaultTypes: faultCategories2.length
    },
    statusCoverage: rest ? buildStatusCoverage(endpointIds, rest.coveredHttpStatus) : null,
    coverage: (report.extra ?? []).map((c) => ({
      toolName: c.toolName,
      criteria: c.criteria.map((cr) => ({ name: cr.name, covered: cr.covered, total: cr.total ?? null }))
    })),
    faultCategories: faultCategories2,
    endpoints: buildEndpoints(report),
    faultDetails,
    faultGroups,
    warnings: buildWarnings(report),
    namedExamples: buildNamedExamples(report),
    testFiles: report.testFilePaths.map((path) => ({
      path,
      testCases: report.testCases.filter((tc) => tc.filePath === path).length
    })),
    testCases: report.testCases.map((tc) => {
      const id = tc.id ?? tc.name ?? "";
      return {
        id,
        name: tc.name ?? id,
        filePath: tc.filePath ?? null,
        startLine: tc.startLine ?? null,
        endLine: tc.endLine ?? null,
        hasFaults: faultyTestIds.has(id)
      };
    })
  };
};
const toStats = (model) => ({
  faults: model.totals.faults,
  distinctFaultTypes: model.totals.distinctFaultTypes,
  faultCategories: model.faultCategories.map((f) => ({ id: f.id, code: f.code, count: f.count })),
  testCases: model.totals.testCases,
  endpoints: model.totals.endpoints,
  warnings: model.warnings.length
});
const encoder = new TextEncoder();
const byteLength = (text) => encoder.encode(text).length;
const DOT = " &middot; ";
const OMITTED_ROWS_TEXT = "more rows omitted. See the interactive report for the full list.";
const escapeHtml = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const escapeInline = (text) => escapeHtml(text).replace(/[\\`*_[\]|~]/g, (ch) => "\\" + ch).replace(/\r?\n/g, "<br>");
const code = (text) => `<code>${escapeInline(text.replace(/\r?\n/g, " "))}</code>`;
const URL_UNSAFE = { "(": "%28", ")": "%29", " ": "%20", "<": "%3C", ">": "%3E" };
const link = (text, url) => `[${text}](${url.replace(/[() <>]/g, (ch) => URL_UNSAFE[ch])})`;
const anchor = (name) => `<a name="${name}"></a>`;
const anchorLink = (name) => `#user-content-${name}`;
const table = (headers, rows) => {
  const line = (cells) => "| " + cells.join(" | ") + " |";
  return [line(headers), line(headers.map(() => "---")), ...rows.map(line)].join("\n") + "\n";
};
const details = (summary, body) => `<details>
<summary>${summary}</summary>

${body}
</details>
`;
const heading = (level, text) => `${"#".repeat(level)} ${text}
`;
const section = (title, body) => heading(3, title) + "\n" + body;
const withAnchor = (name, text) => `${anchor(name)}

${text}`;
const omittedNote = (omitted) => omitted > 0 ? `
_${omitted} ${OMITTED_ROWS_TEXT}_
` : "";
const renderWithinBudget = (items, render, maxBytes) => {
  const full = render(items, 0);
  if (byteLength(full) <= maxBytes) return full;
  let lo = 0;
  let hi = items.length - 1;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (byteLength(render(items.slice(0, mid), items.length - mid)) <= maxBytes) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }
  const text = render(items.slice(0, lo), items.length - lo);
  return byteLength(text) <= maxBytes ? text : "";
};
const TOP_ANCHOR = "wfc-top";
const FAULTS_ANCHOR = "wfc-faults";
const ENDPOINTS_ANCHOR = "wfc-endpoints";
const TESTS_ANCHOR = "wfc-tests";
const formatDuration = (seconds) => {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor(s % 3600 / 60);
  const parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (h > 0 || m > 0) parts.push(`${m}m`);
  parts.push(`${s % 60}s`);
  return parts.join(" ");
};
const formatPercent = (part, total) => total > 0 ? `${Math.round(part * 100 / total)}%` : "-";
const statusCodeLabel = (code2) => code2 === NO_RESPONSE_CODE ? "no response" : String(code2);
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
const FAULT_ICON = "&#x1F534;";
const OK_ICON = "&#x2705;";
const TIMER_ICON = "&#x23F1;";
const UP_ICON = "&#x2191;";
const BAR_WIDTH = 10;
const textBar = (part, total) => {
  const filled = total > 0 ? Math.min(BAR_WIDTH, Math.max(0, Math.round(part / total * BAR_WIDTH))) : 0;
  return "&#x2588;".repeat(filled) + "&#x2591;".repeat(BAR_WIDTH - filled);
};
const ratioCell = (part, total) => total > 0 ? `<code>${textBar(part, total)}</code> ${formatPercent(part, total)}` : "-";
const statusIcon = (code2) => {
  if (code2 === NO_RESPONSE_CODE) return "&#x26AA;";
  if (code2 >= 200 && code2 < 300) return "&#x1F7E2;";
  if (code2 >= 300 && code2 < 400) return "&#x1F535;";
  if (code2 >= 400 && code2 < 500) return "&#x1F7E0;";
  if (code2 >= 500) return "&#x1F534;";
  return "";
};
const statusCell = (code2) => {
  const icon = statusIcon(code2);
  return (icon ? icon + " " : "") + statusCodeLabel(code2);
};
const MAX_CONTEXT_LENGTH = 200;
const shortenContext = (context, operationId) => {
  const prefix = `${operationId} -> `;
  const text = context.startsWith(prefix) ? context.slice(prefix.length) : context;
  return text.length > MAX_CONTEXT_LENGTH ? text.slice(0, MAX_CONTEXT_LENGTH - 3) + "..." : text;
};
const renderHeadline = (model) => model.totals.faults > 0 ? `&#x274C; Found ${plural(model.totals.faults, "potential fault")}` : "&#x2705; No potential faults found";
const STATUS_ROWS = [
  { group: "2XX", label: "2XX" },
  { group: "3XX", label: "3XX" },
  { group: "4XX", label: "4XX" },
  { group: "5XX", label: "5XX" },
  { group: "NO_RESPONSE", label: "No response" }
];
const renderHeader = (m) => withAnchor(TOP_ANCHOR, heading(2, renderHeadline(m))) + `
<sub>WFC report schema ${escapeInline(m.schemaVersion)} &middot; created ${escapeInline(m.creationTime)}</sub>
`;
const renderGlance = (m) => {
  const t = m.totals;
  const parts = [];
  if (t.faults > 0) {
    parts.push(`**${plural(t.faults, "potential fault")}**`, plural(t.distinctFaultTypes, "fault type"));
    if (t.endpoints !== null) {
      const affected = m.endpoints.filter((e) => e.declared && e.faultCodes.length > 0).length;
      parts.push(`${affected}/${t.endpoints} endpoints affected`);
    }
  } else {
    parts.push("**No potential faults found**");
  }
  parts.push(plural(t.testCases, "test case"), `${TIMER_ICON} ${formatDuration(m.executionTimeInSeconds)}`);
  return `> [!${t.faults > 0 ? "CAUTION" : "TIP"}]
> ${parts.join(DOT)}
`;
};
const renderNavigation = (m, o, hasTests) => {
  const items = [];
  if (m.faultCategories.length > 0) items.push(link("Faults", anchorLink(FAULTS_ANCHOR)));
  if (m.endpoints.length > 0) items.push(link("Endpoints", anchorLink(ENDPOINTS_ANCHOR)));
  if (hasTests) items.push(link("Tests", anchorLink(TESTS_ANCHOR)));
  if (o.artifactUrl) items.push(link("Interactive report", o.artifactUrl));
  return items.length > 0 ? items.join(DOT) + "\n" : "";
};
const renderLinks = (o) => {
  const lines = [];
  if (o.artifactUrl) {
    lines.push(`> **Interactive report:** ${link("download the artifact", o.artifactUrl)}, unzip it and open \`low-code-index.html\` in a browser.`);
  }
  if (o.runUrl) {
    lines.push(`> **Workflow run:** ${link(o.runUrl, o.runUrl)}`);
  }
  return lines.length > 0 ? "> [!TIP]\n" + lines.join("\n>\n") + "\n" : "";
};
const renderOverview = (m) => {
  const t = m.totals;
  const rows = [];
  if (t.endpoints !== null) rows.push(["Endpoints", String(t.endpoints)]);
  rows.push(
    ["Test files", String(t.testFiles)],
    ["Test cases", String(t.testCases)]
  );
  if (t.outputHttpCalls !== null) rows.push(["HTTP calls in generated tests", String(t.outputHttpCalls)]);
  if (t.evaluatedHttpCalls !== null) rows.push(["HTTP calls evaluated during fuzzing", String(t.evaluatedHttpCalls)]);
  rows.push(
    ["Potential faults", String(t.faults)],
    ["Distinct fault types", String(t.distinctFaultTypes)],
    ["Execution time", formatDuration(m.executionTimeInSeconds)]
  );
  return section("Overview", table(["Metric", "Value"], rows));
};
const renderStatusCoverage = (m) => {
  const sc = m.statusCoverage;
  if (!sc) return "";
  const rows = STATUS_ROWS.filter((r) => r.group !== "NO_RESPONSE" || sc.counts.NO_RESPONSE > 0).map((r) => [r.label, `${sc.counts[r.group]}/${sc.total}`, ratioCell(sc.counts[r.group], sc.total)]);
  return section(
    "Endpoint status coverage",
    "Endpoints for which at least one generated test received a response in the given status class.\n\n" + table(["Status", "Endpoints", "Ratio"], rows)
  );
};
const renderCodeCoverage = (m) => m.coverage.map((c) => section(
  "Code coverage",
  table(["Criterion", "Covered", "Total", "Ratio"], c.criteria.map((cr) => [
    escapeInline(cr.name),
    String(cr.covered),
    cr.total === null ? "-" : String(cr.total),
    cr.total === null ? "-" : ratioCell(cr.covered, cr.total)
  ]))
)).join("\n");
const warningsSection = (total) => (items, omitted) => section(
  `Warnings (${total})`,
  "> [!WARNING]\n" + items.map((w) => `> - ${w.category ? `**${escapeInline(w.category)}**: ` : ""}${escapeInline(w.message)}`).join("\n") + "\n" + omittedNote(omitted)
);
const namedExamplesSection = (total) => (items, omitted) => details(`Named examples (${total})`, table(["Example", "Test cases"], items.map((e) => [
  escapeInline(e.name),
  String(e.testCaseIds.length)
])) + omittedNote(omitted));
const FAULT_CATEGORY_HEADERS = ["Code", "Id", "Name", "Affected endpoints", "Faults"];
const MAX_TEST_IDS_PER_CELL = 3;
const faultCategoryRow = (f, totalEndpoints) => [
  `F${f.code}`,
  f.id === null ? "-" : code(f.id),
  escapeInline(f.name),
  totalEndpoints === null ? String(f.operationCount) : `${f.operationCount}/${totalEndpoints}` + (f.undeclaredOperationCount > 0 ? ` (+${f.undeclaredOperationCount} not in schema)` : ""),
  String(f.count)
];
const renderFaultPie = (m) => m.faultCategories.length < 2 ? "" : "\n```mermaid\npie showData title Faults by category\n" + m.faultCategories.map((f) => `    "F${f.code}" : ${f.count}`).join("\n") + "\n```\n";
const renderFaultCategories = (m) => m.faultCategories.length === 0 ? "" : withAnchor(FAULTS_ANCHOR, section(
  "Faults by category",
  table(FAULT_CATEGORY_HEADERS, m.faultCategories.map((f) => faultCategoryRow(f, m.totals.endpoints))) + renderFaultPie(m)
));
const testIdsCell = (ids, anchors) => ids.slice(0, MAX_TEST_IDS_PER_CELL).map((id) => {
  const name = anchors.get(id);
  return name ? link(code(id), anchorLink(name)) : code(id);
}).join(", ") + (ids.length > MAX_TEST_IDS_PER_CELL ? ` (+${ids.length - MAX_TEST_IDS_PER_CELL} more)` : "");
const faultRowsOf = (groups) => groups.flatMap((group) => group.rows.map((row) => ({ group, row })));
const faultDetailsSection = (total, anchors) => (items, omitted) => {
  const byGroup = /* @__PURE__ */ new Map();
  for (const { group, row } of items) {
    const rows = byGroup.get(group) ?? [];
    rows.push(row);
    byGroup.set(group, rows);
  }
  const blocks = [...byGroup.entries()].map(([g, rows]) => details(
    `<b>F${g.code}</b> ${g.id === null ? "" : `<code>${escapeHtml(g.id)}</code> `}${escapeHtml(g.name)}${DOT}${plural(g.faults, "fault")} on ${plural(g.operations, "endpoint")}`,
    table(["Operation", "Faults", "Example", "Test cases"], rows.map((r) => [
      code(r.operationId) + (r.declared ? "" : " _(not in schema)_"),
      String(r.faults),
      r.example === null ? "-" : escapeInline(shortenContext(r.example, r.operationId)),
      testIdsCell(r.testCaseIds, anchors)
    ]))
  ));
  return section(`Fault details (${total})`, blocks.join("\n") + omittedNote(omitted));
};
const faultCountsByEndpoint = (groups) => {
  const counts = /* @__PURE__ */ new Map();
  for (const g of groups) {
    for (const r of g.rows) {
      const list = counts.get(r.operationId) ?? [];
      list.push({ code: g.code, faults: r.faults });
      counts.set(r.operationId, list);
    }
  }
  return counts;
};
const sortByFaults = (endpoints, counts) => endpoints.map((e, index) => ({ e, index, faults: (counts.get(e.endpoint) ?? []).reduce((sum, c) => sum + c.faults, 0) })).sort((a, b) => b.faults - a.faults || a.index - b.index).map((x) => x.e);
const endpointsSection = (total, counts) => (items, omitted) => details(`Endpoints (${total})`, table(["Endpoint", "Responses", "Faults", "Test cases"], items.map((e) => {
  const faults = counts.get(e.endpoint) ?? [];
  return [
    code(e.endpoint) + (e.declared ? "" : " _(not in schema)_"),
    e.statusCodes.map(statusCell).join(", ") || "-",
    faults.length > 0 ? faults.map((f) => `${FAULT_ICON} F${f.code} &times;${f.faults}`).join(", ") : `${OK_ICON} none`,
    String(e.testCaseIds.length)
  ];
})) + omittedNote(omitted));
const getLanguage = (fileName) => {
  switch (fileName.split(".").pop()) {
    case "java":
      return "java";
    case "js":
      return "javascript";
    case "py":
      return "python";
    case "ts":
      return "typescript";
    case "kt":
      return "kotlin";
    default:
      return "plaintext";
  }
};
const slug = (id) => id.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const sliceLines = (lines, startLine, endLine) => {
  if (!startLine || !endLine) return null;
  const startIndex = Math.max(0, startLine);
  const endIndex = Math.min(lines.length - 1, endLine - 1);
  if (startIndex > endIndex || startIndex >= lines.length) return null;
  return lines.slice(startIndex, endIndex + 2).join("\n");
};
const buildGeneratedTests = (testCases, sources) => {
  const ordered = [...testCases.filter((t) => t.hasFaults), ...testCases.filter((t) => !t.hasFaults)];
  const splitFiles = /* @__PURE__ */ new Map();
  const linesOf = (path) => {
    const content = sources.get(path);
    if (content === void 0) return void 0;
    let lines = splitFiles.get(path);
    if (!lines) {
      lines = content.replace(/\r/g, "").split("\n");
      splitFiles.set(path, lines);
    }
    return lines;
  };
  const usedAnchors = /* @__PURE__ */ new Set();
  const tests = [];
  for (const tc of ordered) {
    if (tc.filePath === null) continue;
    const lines = linesOf(tc.filePath);
    if (!lines) continue;
    const code2 = sliceLines(lines, tc.startLine, tc.endLine);
    if (code2 === null || code2.trim().length === 0) continue;
    const base = "test-" + (slug(tc.id) || "case");
    let name = base;
    for (let i = 2; usedAnchors.has(name); i++) name = `${base}-${i}`;
    usedAnchors.add(name);
    const language = getLanguage(tc.filePath);
    tests.push({
      id: tc.id,
      name: tc.name,
      filePath: tc.filePath,
      anchor: name,
      language: language === "plaintext" ? "text" : language,
      code: code2
    });
  }
  return tests;
};
const fenceFor = (code2) => {
  const longest = (code2.match(/`+/g) ?? []).reduce((max, run) => Math.max(max, run.length), 0);
  return "`".repeat(Math.max(3, longest + 1));
};
const renderTestSummary = (test, faults) => {
  const parts = [`<b>${escapeHtml(test.name)}</b>`];
  if (faults.codes.length > 0) parts.push(faults.codes.map((c) => `F${c}`).join(", "));
  if (faults.operations.length > 0) {
    const more = faults.operations.length > 1 ? ` (+${faults.operations.length - 1} more)` : "";
    parts.push(`<code>${escapeHtml(faults.operations[0])}</code>${more}`);
  }
  return parts.join(DOT);
};
const renderGeneratedTest = (test, faults, backLink) => {
  const fence = fenceFor(test.code);
  const back = backLink ? `
[${UP_ICON} back to faults](${backLink})
` : "";
  return `${anchor(test.anchor)}
<details open>
<summary>${renderTestSummary(test, faults)}</summary>

${fence}${test.language}
${test.code.replace(/\s+$/, "")}
${fence}
${back}
</details>
`;
};
const testFaultInfo = (faultDetails) => {
  const found = /* @__PURE__ */ new Map();
  for (const d of faultDetails) {
    for (const id of d.testCaseIds) {
      const entry = found.get(id) ?? { codes: /* @__PURE__ */ new Set(), operations: /* @__PURE__ */ new Set() };
      entry.codes.add(d.code);
      entry.operations.add(d.operationId);
      found.set(id, entry);
    }
  }
  return new Map([...found.entries()].map(([id, e]) => [id, { codes: [...e.codes].sort((a, b) => a - b), operations: [...e.operations] }]));
};
const generatedTestsSection = (all, info, backLink) => (items, omitted) => {
  const fileTotals = /* @__PURE__ */ new Map();
  all.forEach((t) => fileTotals.set(t.filePath, (fileTotals.get(t.filePath) ?? 0) + 1));
  const byFile = /* @__PURE__ */ new Map();
  for (const t of items) {
    const tests = byFile.get(t.filePath) ?? [];
    tests.push(t);
    byFile.set(t.filePath, tests);
  }
  const blocks = [...byFile.entries()].map(([file, tests]) => heading(4, `${escapeInline(file)} (${fileTotals.get(file)})`) + "\n" + tests.map((t) => renderGeneratedTest(t, info.get(t.id) ?? { codes: [], operations: [] }, backLink)).join("\n"));
  return section(
    `Generated tests (${all.length})`,
    "Click a test case id in the tables above to jump to its code.\n\n" + blocks.join("\n") + omittedNote(omitted)
  );
};
const DEFAULT_JOB_SUMMARY_MAX_BYTES = 1e6;
const TRUNCATED_NOTE = "\n\n_Summary truncated due to the size limit. See the interactive report._\n";
const sectionOmittedNote = (title) => `_${title}: section omitted due to the size limit. See the interactive report._
`;
const budgetedSection = (items, title, render, anchorName) => {
  if (items.length === 0) return null;
  const prefix = anchorName ? `${anchor(anchorName)}

` : "";
  return {
    note: prefix + sectionOmittedNote(title),
    render: (maxBytes) => {
      const text = renderWithinBudget(items, render, maxBytes - byteLength(prefix));
      return text.length > 0 ? prefix + text : "";
    }
  };
};
const truncateToBytes = (text, maxBytes) => {
  if (byteLength(text) <= maxBytes) return text;
  const limit = maxBytes - byteLength(TRUNCATED_NOTE);
  if (limit <= 0) return "";
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (byteLength(text.slice(0, mid)) <= limit) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }
  const lastLineEnd = text.lastIndexOf("\n", lo);
  return text.slice(0, lastLineEnd > 0 ? lastLineEnd : lo) + TRUNCATED_NOTE;
};
const renderJobSummary = (model, options = {}) => {
  const maxBytes = options.maxBytes ?? DEFAULT_JOB_SUMMARY_MAX_BYTES;
  const generatedTests = options.testSources ? buildGeneratedTests(model.testCases, options.testSources) : [];
  const anchors = /* @__PURE__ */ new Map();
  generatedTests.forEach((t) => {
    if (!anchors.has(t.id)) anchors.set(t.id, t.anchor);
  });
  const counts = faultCountsByEndpoint(model.faultGroups);
  const backLink = model.faultCategories.length > 0 ? anchorLink(FAULTS_ANCHOR) : null;
  const fixed = [
    renderHeader(model),
    renderGlance(model),
    renderNavigation(model, options, generatedTests.length > 0),
    renderLinks(options),
    renderOverview(model),
    renderStatusCoverage(model),
    renderCodeCoverage(model),
    renderFaultCategories(model)
  ].filter((s) => s.length > 0).join("\n");
  const budgeted = [
    budgetedSection(model.warnings, `Warnings (${model.warnings.length})`, warningsSection(model.warnings.length)),
    budgetedSection(
      faultRowsOf(model.faultGroups),
      `Fault details (${model.faultDetails.length})`,
      faultDetailsSection(model.faultDetails.length, anchors)
    ),
    budgetedSection(
      sortByFaults(model.endpoints, counts),
      `Endpoints (${model.endpoints.length})`,
      endpointsSection(model.endpoints.length, counts),
      ENDPOINTS_ANCHOR
    ),
    budgetedSection(
      model.namedExamples,
      `Named examples (${model.namedExamples.length})`,
      namedExamplesSection(model.namedExamples.length)
    ),
    budgetedSection(
      generatedTests,
      `Generated tests (${generatedTests.length})`,
      generatedTestsSection(generatedTests, testFaultInfo(model.faultDetails), backLink),
      TESTS_ANCHOR
    )
  ].filter((s) => s !== null);
  const noteBytes = budgeted.map((s) => byteLength(s.note) + 1);
  const parts = [fixed];
  let remaining = maxBytes - byteLength(fixed);
  budgeted.forEach((s, i) => {
    const reserved = noteBytes.slice(i + 1).reduce((a, b) => a + b, 0);
    const text = s.render(remaining - reserved - 1);
    const chosen = text.length > 0 ? text : noteBytes[i] <= remaining - reserved ? s.note : "";
    if (chosen.length === 0) return;
    parts.push(chosen);
    remaining -= byteLength(chosen) + 1;
  });
  return truncateToBytes(parts.join("\n"), maxBytes);
};
const PR_COMMENT_MARKER = "<!-- wfc-summary:pr-comment -->";
const DEFAULT_PR_COMMENT_MAX_BYTES = 6e4;
const renderPrComment = (model, options = {}) => {
  const maxBytes = options.maxBytes ?? DEFAULT_PR_COMMENT_MAX_BYTES;
  const t = model.totals;
  const head = [
    PR_COMMENT_MARKER,
    heading(3, renderHeadline(model)),
    [
      ...t.endpoints === null ? [] : [`**Endpoints:** ${t.endpoints}`],
      `**Test cases:** ${t.testCases}`,
      `**Potential faults:** ${t.faults}`,
      `**Distinct fault types:** ${t.distinctFaultTypes}`,
      `**Warnings:** ${model.warnings.length}`
    ].join(DOT) + "\n"
  ].join("\n");
  const links = [
    options.runUrl ? `Full summary: ${link("workflow run", options.runUrl)}` : "",
    options.artifactUrl ? `Interactive report: ${link("artifact", options.artifactUrl)}` : ""
  ].filter((s) => s.length > 0).join(DOT);
  const tail = links.length > 0 ? "\n" + links + "\n" : "";
  const categories = model.faultCategories.length === 0 ? "" : renderWithinBudget(
    model.faultCategories,
    (shown, omitted) => table(FAULT_CATEGORY_HEADERS, shown.map((f) => faultCategoryRow(f, t.endpoints))) + omittedNote(omitted),
    maxBytes - byteLength(head) - byteLength(tail) - 1
  );
  return [head, categories].filter((s) => s.length > 0).join("\n") + tail;
};
const DEFAULT_MAX_ANNOTATIONS = 10;
const MAX_OPERATIONS_IN_MESSAGE = 5;
const buildAnnotations = (model, max = DEFAULT_MAX_ANNOTATIONS) => {
  const faults = [...model.faultCategories].sort((a, b) => b.count - a.count || a.code - b.code).map((f) => {
    const operations = [...new Set(model.faultDetails.filter((d) => d.code === f.code).map((d) => d.operationId))];
    const shown = operations.slice(0, MAX_OPERATIONS_IN_MESSAGE).join(", ");
    const more = operations.length > MAX_OPERATIONS_IN_MESSAGE ? ` and ${operations.length - MAX_OPERATIONS_IN_MESSAGE} more` : "";
    return {
      ...f.id === null ? {} : { faultId: f.id },
      level: "warning",
      title: `${f.label} (${plural(f.count, "potential fault")})`,
      message: `${f.name}. Affected operations: ${shown}${more}.`
    };
  });
  const warnings = model.warnings.map((w) => ({
    level: "notice",
    title: w.category ? `Fuzzer warning: ${w.category}` : "Fuzzer warning",
    message: w.message
  }));
  return [...faults, ...warnings].slice(0, Math.max(0, max));
};
const EXIT_OK = 0;
const EXIT_USAGE = 1;
const EXIT_INVALID_REPORT = 2;
const OUTPUT_FORMATS = ["summary", "pr", "annotations", "stats"];
const USAGE = [
  "Usage: node wfc-summary.cjs --report <report.json> [options]",
  "",
  "Options:",
  "  --format <summary|pr|annotations|stats>  Output type (default: summary)",
  "  --artifact-url <url>                     Link to the uploaded interactive report",
  "  --run-url <url>                          Link to the CI run",
  "  --max-bytes <n>                          Size limit for summary and pr output",
  "  --max-annotations <n>                    Maximum number of annotations (default: 10)",
  "  --include-tests                          Embed the code of the generated tests in the summary",
  "  --help                                   Show this message"
].join("\n") + "\n";
const errorMessage = (e) => e instanceof Error ? e.message : String(e);
const parseNonNegativeInt = (name, value) => {
  if (value === void 0) return void 0;
  if (!/^\d+$/.test(value)) {
    throw new Error(`Option --${name} must be a non-negative integer, got '${value}'`);
  }
  return Number(value);
};
const parseOptions = (argv) => {
  const { values } = node_util.parseArgs({
    args: argv,
    strict: true,
    allowPositionals: false,
    options: {
      "report": { type: "string" },
      "format": { type: "string" },
      "artifact-url": { type: "string" },
      "run-url": { type: "string" },
      "max-bytes": { type: "string" },
      "max-annotations": { type: "string" },
      "include-tests": { type: "boolean" },
      "help": { type: "boolean" }
    }
  });
  return {
    report: values["report"],
    format: values["format"] ?? "summary",
    artifactUrl: values["artifact-url"],
    runUrl: values["run-url"],
    maxBytes: parseNonNegativeInt("max-bytes", values["max-bytes"]),
    maxAnnotations: parseNonNegativeInt("max-annotations", values["max-annotations"]),
    includeTests: values["include-tests"] ?? false,
    help: values["help"] ?? false
  };
};
const readTestSources = (reportPath, testFilePaths, io) => {
  const sources = /* @__PURE__ */ new Map();
  for (const path of testFilePaths) {
    const resolved = node_path.isAbsolute(path) ? path : node_path.join(node_path.dirname(reportPath), path);
    try {
      sources.set(path, io.readFile(resolved));
    } catch (e) {
      io.stderr(`Cannot read test file '${resolved}': ${errorMessage(e)}
`);
    }
  }
  return sources;
};
const runCli = (argv, io) => {
  let options;
  try {
    options = parseOptions(argv);
  } catch (e) {
    io.stderr(`${errorMessage(e)}

${USAGE}`);
    return EXIT_USAGE;
  }
  if (options.help) {
    io.stdout(USAGE);
    return EXIT_OK;
  }
  if (!options.report) {
    io.stderr(`Missing required option --report

${USAGE}`);
    return EXIT_USAGE;
  }
  if (!OUTPUT_FORMATS.includes(options.format)) {
    io.stderr(`Unknown format '${options.format}'. Expected one of: ${OUTPUT_FORMATS.join(", ")}
`);
    return EXIT_USAGE;
  }
  let raw;
  try {
    raw = JSON.parse(io.readFile(options.report));
  } catch (e) {
    io.stderr(`Cannot read report '${options.report}': ${errorMessage(e)}
`);
    return EXIT_USAGE;
  }
  const validation = webFuzzingCommonsReportSchema.safeParse(raw);
  if (!validation.success) {
    const issues = validation.error.issues.slice(0, 20).map((i) => `- ${i.path.join(".") || "(root)"}: ${i.message}`).join("\n");
    io.stderr(`Invalid WFC report:
${issues}
`);
    return EXIT_INVALID_REPORT;
  }
  const report = raw;
  const model = buildSummaryModel(report);
  const links = { artifactUrl: options.artifactUrl, runUrl: options.runUrl };
  switch (options.format) {
    case "summary":
      io.stdout(renderJobSummary(model, {
        ...links,
        maxBytes: options.maxBytes,
        testSources: options.includeTests ? readTestSources(options.report, report.testFilePaths, io) : void 0
      }));
      break;
    case "pr":
      io.stdout(renderPrComment(model, { ...links, maxBytes: options.maxBytes }));
      break;
    case "annotations":
      io.stdout(JSON.stringify(buildAnnotations(model, options.maxAnnotations), null, 2) + "\n");
      break;
    case "stats":
      io.stdout(JSON.stringify(toStats(model), null, 2) + "\n");
      break;
  }
  return EXIT_OK;
};
process.exitCode = runCli(process.argv.slice(2), {
  readFile: (path) => node_fs.readFileSync(path, "utf8"),
  stdout: (text) => {
    process.stdout.write(text);
  },
  stderr: (text) => {
    process.stderr.write(text);
  }
});
