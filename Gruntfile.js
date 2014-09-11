module.exports = function(grunt) {
	
	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),
		watch: {
			files: [ "**.js", "!Gruntfile.js", "!script.js" ],
			tasks: [ "browserify" ]
		},
		browserify: {
			js: {
				src: 'main.js',
				dest: 'script.js',
				options: {
//					watch: true,
//					keepAlive: true,
					plugin: [[
						"minifyify", {
							map: "script.js.map",
							output: "script.js.map",
							compressPath: function (p) {
								var path = require("path");
								return path.relative(__dirname, p);
							},
							uglify: {
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
	
	grunt.registerTask("develop", [ "watch" ]);
	grunt.registerTask("build", [ "browserify" ]);
	
};
