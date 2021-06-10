import * as webpack from "webpack";
import * as webpackDevServer from "webpack-dev-server";
import * as path from "path";
import * as HtmlWebpackPlugin from "html-webpack-plugin";


/************************************************************
 * 
 * Plugins
 * 
 ************************************************************/

const plugins: (
    ((this: webpack.Compiler, compiler: webpack.Compiler) => void)
    | webpack.WebpackPluginInstance
)[] = [
        new HtmlWebpackPlugin({
            template: "src/index.html",
        }),
    ];

/************************************************************
 * 
 * devServer
 * 
 ************************************************************/

const devServer: webpackDevServer.Configuration = {
    contentBase: path.join(__dirname, "dist"),
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

const rules: webpack.RuleSetRule[] = [
    ts,
    scss,
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
}

/************************************************************
 * 
 * Config
 * 
 ************************************************************/

const config: webpack.Configuration = {
    entry: "./src/bootstrap.ts",
    devtool: "inline-source-map",
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "bundle.js",
    },
    mode: "development",
    plugins: plugins,
    devServer: devServer,
    module: moduleObj,
    resolve: resolve,
};

export default config;