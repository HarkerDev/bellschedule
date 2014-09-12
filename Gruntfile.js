module.exports = function(grunt) {
	
	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),
		watch: {
			files: [ "script/**.js", "!script/script.js" ],
			tasks: [ "browserify" ]
		},
		browserify: {
			js: {
				src: "script/main.js",
				dest: "script/script.js",
				options: {
//					watch: true,
//					keepAlive: true,
					plugin: [[
						"minifyify", {
							map: "script.js.map",
							output: "script/script.js.map",
							compressPath: function (p) {
								var path = require("path");
								return path.relative(__dirname, p);
							},
							minify: {
								mangle: true
							}
						}
					]],
					browserifyOptions: {
						debug: true
					}
				}
			}
		}
	});
	
	grunt.loadNpmTasks("grunt-browserify");
	grunt.loadNpmTasks("grunt-contrib-watch");
	
	grunt.registerTask("default", [ "build", "watch" ]);
	grunt.registerTask("build", [ "browserify" ]);
	
};
