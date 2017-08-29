[unmaintained-url]: .github/ISSUE_TEMPLATE.md
[unmaintained-image]: https://img.shields.io/badge/project-unmaintained-red.svg

[![Project unmaintained][unmaintained-image]][unmaintained-url]

Core - A Fine Foundation for JavaScript Projects
================================================

Core prepares the ground for JavaScript projects. It fills what is missing, fixes what is wrong, adds what is useful. While doing this it is still a pretty lightweight framework which is a good start for all kind of JavaScript projects.

Core was designed to work together with the JavaScript tooling project [Jasy](https://github.com/sebastian-software/jasy).

[![Code Climate](https://codeclimate.com/github/sebastian-software/core.png)](https://codeclimate.com/github/sebastian-software/core)


## Creating Projects

Core offers a skeleton project for being used via `jasy create`. This allows for an easy usage of Jasy and Core and offers a good set of typical tasks pre-configured for your use. To create a new project execute the following after [Jasy has been installed](https://github.com/sebastian-software/jasy/wiki#installation).:

```bash
jasy create --name myproject --origin https://github.com/sebastian-software/core.git --skeleton application
```

Note: Replace `myproject` with the name of the project (lowecase characters, no spaces) you want to create. A new directory called `myproject` will be created for you.


## Jasy Compatibility

This project is kept compatible with newest development of the [Jasy](http://github.com/sebastian-software/jasy) tooling framework. This means that the newest GitHub versions typically require a recent Jasy version  as well. Take a look at this list to understand what version to choose from:

* **1.5**: Jasy = 1.5.x
* **0.9**: Jasy = 0.8.x
* **0.8**: Jasy = 0.8.x
* **0.7**: Jasy = 0.7.x
* **0.6**: Jasy = 0.6.x
* **0.5**: Jasy = 0.5.x


## License

Copyright (c) 2011-2012 Zynga Inc. http://zynga.com/
Copyright (c) 2012-2014 Sebastian Werner http://sebastian-werner.com

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
