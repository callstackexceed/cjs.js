/*
Copyright 2021 callstackexceed

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
(function(){
    log('CJS started');

    let coreModules = new Map([]);

    let basePath = 'plugins/';

    let utilPath = {
        normalize(path) {
            let dirs = path.split('/');
            if(dirs[dirs.length - 1] === '') {
                dirs.pop();
            }
            let newDirs = dirs.reduce((newDirs, dir) => {
                switch(dir) {
                case '.':
                    /* no-op */
                    break;
                case '..':
                    if(newDirs.length === 0 || newDirs[newDirs.length - 1] == '..') {
                        newDirs.push('..');
                    } else {
                        newDirs.pop();
                    }
                    break;
                default:
                    newDirs.push(dir);
                    break;
                }
                return newDirs;
            }, []);
            return newDirs.join('/');
        },
        join(...paths) {
            let newPath = paths.map((path)=>{
                return utilPath.normalize(path);
            }).join('/');
            return utilPath.normalize(newPath);
        },
        dirname(path) {
            return path.replace(/\/[^\/]+$/, '');
        },
        split(path) {
            return path.split('/');
        }
    };

    let currentModule = createModule('', null);

    currentModule.path = basePath;

    /*
    ** See https://nodejs.org/api/modules.html#modules_all_together
    */

    function resolveID(id) {
        let currentPath = (currentModule && currentModule.path) || basePath;
        let requestPaths = [];
        let result;
        if(coreModules.has(id)) {
            return coreModules.get(id);
        }
        if(id.startsWith('/')) {
            currentPath = '';
        }
        if(id.startsWith('./') || id.startsWith('/') || id.startsWith('../')) {
            result = loadAsFile(utilPath.join(currentPath, id));
            if(result != undefined) {
                return result;
            }
            result = loadAsDirectory(utilPath.join(currentPath, id));
            if(result != undefined) {
                return result;
            }
            throw new Error(`${utilPath.join(currentPath, id)} not found`);
        }
        if(id.startsWith('#')) {
            result = loadPackageImports(id, currentPath);
            if(result != undefined) {
                return result;
            }
        }
        result = loadPackageSelf(id, currentPath);
        if(result != undefined) {
            return result;
        }
        result = loadNodeModules(id, currentPath);
        if(result != undefined) {
            return result;
        }
        throw new Error(`${id} not found, required by ${(currentModule && currentModule.id)}`);


        function tryFile(path) {
            if(path.startsWith('../')) {
                throw new Error('cannot require file out of root dir');
            }
            path = path.replace(/^\//, '');
            let cjsSelf = 'plugins/cjs.js';
            if(path === cjsSelf) {
                throw new Error('cjs.js is trying to load itself');
            }
            requestPaths.push(path);
            let content = file.readFrom(path);
            if(content == undefined) {
                return undefined;
            }
            if(path.endsWith('.mjs')) {
                throw new Error(`ERROR: cannot require a ESM file ${path}`);
            }
            if(path.endsWith('.json')) {
                throw new Error(`ERROR: cannot require a JSON file ${path}`);
            }
            return {
                path,
                content,
                requestPaths
            }
        }

        function loadAsFile(id) {
            let result;
            result = tryFile(id);
            if(result != undefined) {
                return result;
            }
            result = tryFile(`${id}.js`);
            if(result != undefined) {
                return result;
            }
            result = tryFile(`${id}.cjs`);
            if(result != undefined) {
                return result;
            }
            result = tryFile(`${id}.json`);
            if(result != undefined) {
                throw new Error(`cannot require a JSON file ${id}.mjs`);
            }
            result = tryFile(`${id}.mjs`);
            if(result != undefined) {
                throw new Error(`cannot require a ESM file ${id}.mjs`);
            }
            return undefined;
        }

        function loadIndex(id) {
            let result;
            result = tryFile(utilPath.join(id, 'index.js'));
            if(result != undefined) {
                return result;
            }
            result = tryFile(utilPath.join(id, 'index.cjs'));
            if(result != undefined) {
                return result;
            }
            result = tryFile(utilPath.join(id, 'index.json'));
            if(result != undefined) {
                throw new Error(`cannot require a JSON file ${id}.mjs`);
            }
            result = tryFile(utilPath.join(id, 'index.mjs'));
            if(result != undefined) {
                throw new Error(`cannot require a ESM file ${id}.mjs`);
            }
            return undefined;
        }

        function loadAsDirectory(id) {
            let package = file.readFrom(utilPath.join(id, 'package.json'));
            if(package != undefined) {
                let result;
                package = JSON.parse(package);
                if(!package || !package.main) {
                    return loadIndex(id);
                }
                let m = utilPath.join(id, package.main);
                result = loadAsFile(m);
                if(result != undefined) {
                    return result;
                }
                result = loadIndex(m);
                if(result != undefined) {
                    return result;
                }
                throw new Error(`${m} not found`);
            }
            return loadIndex(id);
        }

        
        function loadNodeModules(id, start) {
            let dirs = node_modules_paths(start);
            let result;
            for(let dir of dirs) {
                result = loadPackagExports(utilPath.join(dir, id));
                if(result != undefined) {
                    return result;
                }
                result = loadAsFile(utilPath.join(dir, id));
                if(result != undefined) {
                    return result;
                }
                result = loadAsDirectory(utilPath.join(dir, id));
                if(result != undefined) {
                    return result;
                }
            }
            return undefined;
        }

        function node_modules_paths(start) {
            let parts = utilPath.split(start);
            let dirs = [''];
            for(let i = parts.length; i >= 0; --i) {
                if(parts[i - 1] === "node_modules") {
                    continue;
                }
                let dir = utilPath.join(...parts.slice(0, i), "node_modules");
                dirs.push(dir);
            }
            return dirs;
        }

        function loadPackageImports(id) {
            return undefined;
        }

        function loadPackagExports(id) {
            //TODO
            return undefined;
        }

        function loadPackageSelf(id) {
            return undefined;
        }
    }

    function createModule(id, parent) {
        return {
            children: [],
            parent,
            exports: {},
            filename: id,
            id,
            isPreloading: false,
            loaded: false,
            path: utilPath.dirname(id),
            paths: undefined,
            require: cjsRequire
        };
    }

    function cjsRequire(id) {
        let parrentModule = currentModule;
        let {path, content} = resolveID(id);
        if(cjsRequire.cache[path] !== undefined) {
            let thisModule = cjsRequire.cache[path];
            if(parrentModule && !parrentModule.children.includes(thisModule)) {
                parrentModule.children.push(thisModule);
            }
            if(thisModule.loaded === false) {
                //TODO
            }
            return thisModule.exports;
        }
        let moduleObject = createModule(path, parrentModule);
        currentModule = moduleObject;
        cjsRequire.cache[path] = moduleObject;
        let code = new Function(
            'exports',
            'require',
            'module',
            '__filename',
            '__dirname',
            content
        ); 
        code.apply(moduleObject, [
            moduleObject.exports,
            cjsRequire,
            moduleObject,
            path,
            utilPath.dirname(path)
        ]);
        currentModule.loaded = true;
        currentModule = parrentModule;
        return moduleObject.exports;
    }

    cjsRequire.main = currentModule;

    cjsRequire.cache = {
        '': currentModule
    };

    cjsRequire.resolve = function resolve(request) {
        let obj = resolveID(request);
        return obj && obj.path;
    }

    cjsRequire.resolve.paths = function paths(request) {
        let obj = resolveID(request);
        return obj && obj.requestPaths;
    }

    globalThis.require = cjsRequire;
})();

/*
--------------------------------------------------------------------------
*/

try {
    let cjsPath = 'plugins/cjs/';
    let startFiles = undefined;
    if(!file.checkIsDir(cjsPath)) {
        throw new Error('cannot find directory "cjs", cjs.js cannot work');
    }
    let package = file.readFrom(`${cjsPath}/package.json`);
    if(package != undefined) {
        package = JSON.parse(package);
        let main = package && package.main;
        if(main != undefined) {
            if(Array.isArray(main)) {
                startFiles = main.map((f) => `${cjsPath}/${f}`);
            } else {
                startFiles = `${cjsPath}/${main}`;
            }
        }
    }
    if(startFiles === undefined) {
        startFiles = file.getFilesList(cjsPath);
        startFiles.fliter((f)=> f.endsWith('.js') || f.endsWith('.cjs'))
        .sort()
        .map((f)=>{
            return `/${cjsPath}/${f}`;
        });
    }
    if(Array.isArray(startFiles)) {
        for(let startFile of startFiles) {
            require(startFile);
        }
    } else {
        require(startFiles);
    }
} catch (e) {
    colorLog('dk_red', e && e.toString && e.toString());
}
