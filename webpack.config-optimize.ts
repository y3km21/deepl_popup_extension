import * as webpack from "webpack";
import * as webpackDevServer from "webpack-dev-server";
import * as path from "path";
import * as HtmlWebpackPlugin from "html-webpack-plugin";
import * as CopyPlugin from "copy-webpack-plugin";

/************************************************************
 * 
 * Plugins
 * 
 ************************************************************/

const htmlWebpackPluginArray = (fileNameArray: string[]): (
    ((this: webpack.Compiler, compiler: webpack.Compiler) => void)
    | webpack.WebpackPluginInstance
)[] => {
    return fileNameArray.map(fileName => new HtmlWebpackPlugin({
        filename: fileName + ".html",
        chunks: [fileName],
        title: fileName,
        template: "src/index.html"
    }));
};

const copyManifestJson: CopyPlugin = new CopyPlugin({
    patterns: [
        {
            from: path.resolve(__dirname, "src", "manifest.json"),
            to: path.resolve(__dirname,
                "prod", "manifest.json")
        }
    ]
})

const copyIcons: CopyPlugin = new CopyPlugin({
    patterns: [
        {
            from: path.resolve(__dirname, "src", "icons", "icon128.png"),
            to: path.resolve(__dirname, "prod", "icon128.png")
        }
        , {
            from: path.resolve(__dirname, "src", "icons", "icon48.png"),
            to: path.resolve(__dirname, "prod", "icon48.png")
        }, {
            from: path.resolve(__dirname, "src", "icons", "icon16.png"),
            to: path.resolve(__dirname, "prod", "icon16.png")
        }
    ]
})


const plugins: (
    ((this: webpack.Compiler, compiler: webpack.Compiler) => void)
    | webpack.WebpackPluginInstance
)[]
    = htmlWebpackPluginArray(["popup", "options"]).concat(copyManifestJson).concat(copyIcons);

/************************************************************
 * 
 * devServer
 * 
 ************************************************************/

const devServer: webpackDevServer.Configuration = {
    hot: true,
    index: "options.html",
    contentBase: path.join(__dirname, "prod"),
    compress: true,
    port: 8080,
};

/************************************************************
 * 
 * Module
 * 
 ************************************************************/
// Rules
const ts: webpack.RuleSetRule = {
    test: /\.tsx?$/,
    use: [
        {
            loader: "ts-loader",
            options: {
                transpileOnly: true,
            }
        }
    ],
    exclude: [/node_modules/],
};


const scss: webpack.RuleSetRule = {
    test: /\.s[ac]ss$/i,
    use: [
        // Creates `style` nodes from JS strings
        "style-loader",
        // Translates CSS into CommonJS
        "css-loader",
        // Compiles Sass to CSS
        "sass-loader",
    ],
};

var elmSource = path.resolve(__dirname, "src", "options",);

const elm: webpack.RuleSetRule = {
    test: /\.elm$/,
    exclude: [/elm-stuff/, /node_modules/],
    use: [
        {
            loader: 'elm-hot-webpack-loader',
            options: { debug: false }
        },
        {
            loader: 'elm-webpack-loader',
            options: {
                cwd: elmSource,
                optimize: true
            },
        }
    ]
}


const rules: webpack.RuleSetRule[] = [
    ts,
    scss,
    elm,
];

// Module
const moduleObj: webpack.ModuleOptions = {
    rules: rules
};

/************************************************************
 * 
 * Resolve
 * 
 ************************************************************/

const resolve: webpack.ResolveOptions = {
    extensions: [".tsx", ".ts", ".js"],
    fallback: {
        "path": require.resolve("path-browserify"),
    }
}

/************************************************************
 * 
 * Config
 * 
 ************************************************************/

const config: webpack.Configuration = {
    entry: {
        popup: "./src/popup/bootstrap.ts",
        options: "./src/options/bootstrap.ts",
        background: "./src/background/index.ts",

    },
    devtool: "inline-source-map",
    output: {
        path: path.resolve(__dirname, "prod"),
        filename: "[name].js",
    },
    mode: "production",
    plugins: plugins,
    devServer: devServer,
    module: moduleObj,
    resolve: resolve,
};

export default config;