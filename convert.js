const fs = require('fs');
const path = require('path');

function convertUltiSnipsToVSCode(ultiSnipsFile, vscodeSnippetsFile) {
    const ultiSnipsContent = fs.readFileSync(ultiSnipsFile, 'utf8');
    const lines = ultiSnipsContent.split('\n');
    const vscodeSnippets = {};

    let snippetName = '';
    let prefix = '';
    let body = [];
    let description = '';

    function transformPlaceholders(line) {
        // Replace ${1:text} and $1 placeholders
        return line.replace(/\$\{(\d+):([^}]+)\}/g, (match, p1, p2) => {
            return `\${${p1}:${p2}}`;
        }).replace(/\$(\d+)/g, (match, p1) => {
            return `\${${p1}}`;
        });
    }

    lines.forEach(line => {
        if (line.startsWith('snippet')) {
            if (snippetName) {
                vscodeSnippets[description] = {
                    prefix: prefix,
                    body: body.filter(line => line.trim() !== ''),
                    description: description
                };
                body = [];
            }
            const parts = line.match(/snippet\s+(\S+)(?:\s+["']([^"']+)["'])?(?:\s+(\S+))?/);
            snippetName = parts[1];
            description = parts[2] || '';
            prefix = parts[3] || snippetName;
        } else if (line.startsWith('endsnippet')) {
            if (snippetName) {
                vscodeSnippets[description] = {
                    prefix: prefix,
                    body: body.filter(line => line.trim() !== ''),
                    description: description
                };
                snippetName = '';
                prefix = '';
                body = [];
                description = '';
            }
        } else {
            if (line.trim() !== '') {
                body.push(transformPlaceholders(line));
            }
        }
    });

    // Write any remaining snippet to the output file
    if (snippetName) {
        vscodeSnippets[description] = {
            prefix: prefix,
            body: body.filter(line => line.trim() !== ''),
            description: description
        };
    }

    fs.writeFileSync(vscodeSnippetsFile, JSON.stringify(vscodeSnippets, null, 2), 'utf8');
}

function convertAllSnippets(srcDir, destDir) {
    fs.readdir(srcDir, (err, files) => {
        if (err) {
            console.error(`Error reading directory ${srcDir}: ${err.message}`);
            return;
        }

        files.forEach(file => {
            if (file.endsWith('.snippets')) {
                const ultiSnipsFile = path.join(srcDir, file);
                const vscodeSnippetsFile = path.join(destDir, `${path.basename(file, '.snippets')}.json`);
                convertUltiSnipsToVSCode(ultiSnipsFile, vscodeSnippetsFile);
                console.log(`${ultiSnipsFile} --> ${vscodeSnippetsFile}`);
            }
        });
    });
}

const srcDir = path.resolve(__dirname, 'src');
const destDir = path.resolve(__dirname, 'snippets');

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir);
}

convertAllSnippets(srcDir, destDir);
