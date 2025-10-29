# i18next standard

## plural

- this is sample of key(can be any word) with and without count

```
{
  "key_one": "item",
  "key_other": "items",
  "keyWithCount_one": "{{count}} item",
  "keyWithCount_other": "{{count}} items"
}
```

### output on android must be

```
<plurals names="key">
    <item quantity="one">item</item>
    <item quantity="other">items</item>
</plurals

<plurals names="keyWithCount">
    <item quantity="one">%d item</item>
    <item quantity="other">%d items</item>
</plurals>
```

- this is for non-integer quantities

```
{
  "key_zero": "zero",
  "key_one": "singular",
  "key_two": "two",
  "key_few": "few",
  "key_many": "many",
  "key_other": "other"
}
```

### output on android must be

```
<plurals name="key">
    <item quantity="zero">zero</item>
    <item quantity="singular">singular</item>
    <item quantity="two">two</item>
    <item quantity="few">few</item>
    <item quantity="many">many</item>
    <item quantity="other">other</item>
</plurals>
```

## interpolation

- follow settings.json file on project.inlang/settings.json with key variableReferencePattern
- for example with variableReferencePattern == "{{","}}"
- output ios follow xcstring standard

```
{
    "key": "{{what}} is {{how}}"
}
```

### output on android must be

```
<string name="key">%1$s is %2$s</string>
```

## formatting

- follow settings.json file on project.inlang/settings.json with key variableReferencePattern
- for example with variableReferencePattern == "{{","}}"
- format following {{value, formatname(options1: options1Value)}}, which value is a key so its can be any word, and format is datatype, and option is like extra formating like minimumFractionDigit to put number behind coma
- output ios follow xcstring standard

```
{
  "intlNumber": "Some {{val, number}}",
  "intlNumberWithOptions": "Some {{val, number(minimumFractionDigits: 2)}}"
}
```

### output on android must be

```
<string name="intlNumber">Some $d</string> => number = $d, string = $s
<string name="intlNumberWithOptions">Some $%.2f</string> => minimumFractionDigits:2 = $%.2f
```

## output directory

- Android = /output/android
- iOs = /output/ios
