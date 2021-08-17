# CJS.JS

CJS.JS 是[lxl](https://lxl.litetitle.com/)的commonJS实现。

[English documentation is here.](./README.md)

## 什么是CJS?

CJS就是所谓的[commonjs](http://wiki.commonjs.org/wiki/Modules/1.1.1)，是JavaScript的一个模块规范，在node社区中使用最广泛。

一个简单的示例:

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

在这个例子中，`a.js` require 了 `b.js`， "导入"了`b.js`"导出"的函数`print`。

更多信息请参见[node的CJS文档](https://nodejs.org/api/modules.html)。

## 如何使用它?

首先下载[它](https://github.com/callstackexceed/cjs.js/raw/main/cjs.js)。

下面是使用它的建议方法。

在`plugins`目录下创建一个名为`cjs/`的目录。

CJS.JS 将在`cjs/`中搜索`.js`文件，并逐个(按字母顺序)加载它们。

如果其中有一个JSON文件`package.json`，`cjs.js`将只尝试加载在"main"字段引用的文件。

(当然，如果一个文件被其他文件 require 的话，它最终会被加载如果后者被加载。)

```JS
{
	"main": "index.js"
}

```

如果`package.json`是这样的，只有`plugins/cjs/index.js`将被尝试加载。

如果"main"字段是`string[]`而不是`string`，列表文件将按出现的顺序加载。

## 我不想使用固执己见的目录`cjs/`，我只想使用`require`，我应该怎么做?

有一个分隔符将文件分成如下两部分。
```JS
/*
--------------------------------------------------------------------------
*/
```

第一部分只是在全局中注入`require`。

你可以删除第二部分，然后用require在下面来写你自己的代码，如:

```JS
/*
--------------------------------------------------------------------------
*/
require('./lib/some-libs.js');
```
它将正常工作。

两种方式的区别是对后者，当不同的插件都加载一个文件，它会被多次加载。原因是不同的插件在不同的JavaScript环境中运行。

在不同的JavaScript环境中运行不同的插件会使插件更安全，但在CJS中并不完全正确。

还要注意，如果你使用`cjs/`方法，所有文件将在相同的JavaScript环境中加载，这可能是危险的。

## 它可以用来`require` `node_modules` JS包吗?

这很难说，而且没有**承诺**。

有证据表明它至少可以加载一些简单的JS包。

然而，它目前不能理解`package.json`中的"exports"字段，因此它将不能加载某些包。

注意，基岩服务器目录外的`node_modules`中的包永远不会被加载。

## 关于CJS.JS的作者

CJS.JS的作者是[callstackexceed](https://github.com/callstackexceed)，也是MC addon[**NormaConstructor**](https://github.com/NorthernOceanS/NormaConstructor)的一个开发者。

**NormaConstructor**是一个开源的快速构建插件，目前运行在scripting API和lxl上。

**NormaConstructor**刚刚发布了beta版，它不仅需要用户，也需要开发人员。

如果你喜欢这个lxl插件，请也看看**NormaConstructor**。
