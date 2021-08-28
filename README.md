# CJS.JS

CJS.JS is a commonJS implemention for [lxl](https://lxl.litetitle.com/).

[中文文档在这。](./README-zh.md)

## What is CJS?

CJS is the so called [commonjs](http://wiki.commonjs.org/wiki/Modules/1.1.1), a module specification of JavaScript, which is most wildly used in node community.

An easy sample:

```JS
// in file plugins/cjs/a.js
let b = require('./b.js');
b.print('value printed!');
// output: value printed!

// in file plugins/cjs/b.js
let print = function (value) {
  log(value);
};
module.exports.print = print;

```

In this example, `a.js` require the `b.js`, "import" the function `print` "exported" by `b.js`.

See [node document for CJS](https://nodejs.org/api/modules.html) for more information.

## How to use it?

Download [it](https://github.com/callstackexceed/cjs.js/raw/main/cjs.js) firstly.

Here is the recommand way to use it.

Create a directory named `cjs/` in directory `plugins`.

CJS.JS will search for `.js` file in `cjs/` and load them one by one (in alphabet order).

if there is a JSON file `package.json` in it, `cjs.js` will just trying to load the file refered in "main" field.

(Of course that if a file required by other file will finally be load if the latter is loaded.)

```JS
{
	"main": "index.js"
}

```

If `package.json` is like this, just `plugins/cjs/index.js` will be trying load.

If the "main" field is `string[]` instead of `string`, the list files will be loaded in order they appear.

## I don't want to use opinioned directory `cjs/`, I just want to use `require`, what should I do?

There is a devider devide the file into two parts as below.
```JS
/*
--------------------------------------------------------------------------
*/
```

The first part is nothing but inject `require` into global.

You can just delete the second part, and write you own codes with `require` below, like:

```JS
/*
--------------------------------------------------------------------------
*/
require('./lib/some-libs.js');
```
It will work correctly.

You can also use [pure-require.js](https://github.com/callstackexceed/cjs.js/raw/main/pure-require.js), who has only the first part of `cjs.js`.

The difference between two way is the latter way will load one file more than once when different plugin all load it. The reason is different plugins run in different JavaScript environment.

Run different plugins in different JavaScript environment make plugins safer, but it's not totally correct in CJS.

Also notice if you use `cjs/` method, all files will be loaded in same JavaScript environment, which may be dangerous.

## Can it be used to `require` JS package in `node_modules`?

It's hard to say, and no **promise** is given.

There is evdience that it can at least load some simple JS package.

However, it currently cannot understant "exports" field in `package.json`, so it will faild to load some package.

Notice that package in `node_modules` out of the bedrock directory will never being loaded.

## About anthor of CJS.JS

The author of CJS.JS is [callstackexceed](https://github.com/callstackexceed), who is also a developer of the MC addon [**NormaConstructor**](https://github.com/NorthernOceanS/NormaConstructor).

**NormaConstructor** is a open source fast building addon currently runs on both scripting API and lxl.

**NormaConstructor** just has released its beta release, and it really needs developers as well as users.

If you like this lxl plugin, please also have a look on **NormaConstructor**.
