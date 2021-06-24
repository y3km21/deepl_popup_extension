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
                "dist", "manifest.json")
        }
    ]
})

let copyIcons: (sizenums: number[], outdir: string) => CopyPlugin = (sizenums, outdir) => {
    let patterns = sizenums.map((val) => {
        return {
            from: path.resolve(__dirname, "src", "icons", `icon${val}.png`),
            to: path.resolve(__dirname, outdir, `icon${val}.png`)
        }
    })

    return new CopyPlugin({ patterns: patterns })
}
let iconsSize = [16, 48, 128];

const plugins: (
    ((this: webpack.Compiler, compiler: webpack.Compiler) => void)
    | webpack.WebpackPluginInstance
)[]
    = htmlWebpackPluginArray(["popup", "options"]).concat(copyManifestJson).concat(copyIcons(iconsSize, "dist"));

/************************************************************
 * 
 * devServer
 * 
 ************************************************************/

const devServer: webpackDevServer.Configuration = {
    hot: true,
    index: "options.html",
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

var elmSource = path.resolve(__dirname, "src", "options",);

const elm: webpack.RuleSetRule = {
    test: /\.elm$/,
    exclude: [/elm-stuff/, /node_modules/],
    use: [
        {
            loader: 'elm-hot-webpack-loader',
            options: { debug: true }
        },
        {
            loader: 'elm-webpack-loader',
            options: { /*cwd: elmSource */ },
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
        path: path.resolve(__dirname, "dist"),
        filename: "[name].js",
    },
    mode: "development",
    plugins: plugins,
    devServer: devServer,
    module: moduleObj,
    resolve: resolve,
};

export default config;