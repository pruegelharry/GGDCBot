package main

import (
	"fmt"
	"os"
	"strings"

	v8 "rogchap.com/v8go"
)

func main() {
	// errors on non-linux environments
	ctx := v8.NewContext()
	defer ctx.Isolate().Dispose()
	defer ctx.Close()

	b, err := os.ReadFile("out.js")
	if err != nil {
		fmt.Print(err)
	}
	str := string(b)
	formattedStr := strings.ReplaceAll(strings.Trim(str, "\n"), `"`, "'")

	ctx.RunScript(formattedStr, "main.js")
	val, err := ctx.RunScript("result", "value.js")
	if err != nil {
		fmt.Println(err)
	}
	fmt.Println(val)
}
