// Run from repository root; standard library only. No messages are sent.
package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"html/template"
	"os"
	"strings"
)

func must(err error) {
	if err != nil {
		panic(err)
	}
}
func main() {
	root := "supabase/templates/account-emails/"
	raw, err := os.ReadFile(root + "subjects.json")
	must(err)
	var subjects map[string]map[string]string
	must(json.Unmarshal(raw, &subjects))
	cases := []struct {
		value any
		want  string
	}{
		{"pl", "pl"}, {"en", "en"}, {"uk", "uk"}, {"ua", "uk"}, {"zh", "zh"},
		{nil, "pl"}, {"fr", "pl"}, {7, "pl"}, {map[string]any{}, "pl"}, {"<script>", "pl"},
	}
	count := 0
	for _, kind := range []string{"recovery", "password_changed"} {
		body, err := os.ReadFile(root + kind + ".html")
		must(err)
		subject, err := os.ReadFile(root + kind + ".subject.txt")
		must(err)
		ht, err := template.New(kind).Parse(string(body))
		must(err)
		st, err := template.New(kind).Parse(string(subject))
		must(err)
		for _, c := range cases {
			metadata := map[string]any{}
			if c.value != nil {
				metadata["locale"] = c.value
			}
			data := map[string]any{"Data": metadata, "ConfirmationURL": "https://example.test/verify?token=test&type=recovery", "SiteURL": "https://example.test"}
			var out, title bytes.Buffer
			must(ht.Execute(&out, data))
			must(st.Execute(&title, data))
			actual := out.String()
			lang := c.want
			if lang == "zh" {
				lang = "zh-Hans"
			}
			if !strings.Contains(actual, `lang="`+lang+`"`) || strings.Count(actual, "<!doctype html>") != 1 {
				panic("wrong language/document")
			}
			if strings.TrimSpace(title.String()) != subjects[c.want][kind] {
				panic("wrong subject")
			}
			if strings.Contains(actual, "{{") || strings.Contains(actual, "ZgotmplZ") {
				panic("unresolved or unsafe link")
			}
			if kind == "recovery" && !strings.Contains(actual, "https://example.test/verify?token=test&amp;type=recovery") {
				panic("lost recovery URL")
			}
			if kind == "password_changed" && strings.Contains(actual, "token=test") {
				panic("unexpected recovery token")
			}
			count++
		}
	}
	fmt.Printf("Passed %d native email template cases.\n", count)
}
