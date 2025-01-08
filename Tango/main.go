package main

import (
	"fmt"
	"os"

	v8 "rogchap.com/v8go"
)

// Hello returns a greeting for the named person.
func main() {
	ctx := v8.NewContext()
	defer ctx.Isolate().Dispose()
	defer ctx.Close()

	b, err := os.ReadFile("out.js") // just pass the file name
	if err != nil {
		fmt.Print(err)
	}
	str := string(b)

	ctx.RunScript(str, "main.js")
	val, _ := ctx.RunScript("w", "value.js")
	fmt.Println(val)
}
