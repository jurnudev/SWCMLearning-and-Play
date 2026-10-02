# Protected build

Source files in the project root stay readable and editable.
To publish a locked copy:

    cd build
    npm install        # first time only
    npm run build      # creates ../dist  (JS obfuscated, CSS/HTML minified)

Deploy the contents of `dist/` only (not the project root).
Run the build again after every change to the source.
