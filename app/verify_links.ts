const URL_REGEX = /((?:https?:\/\/)?(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*))/gi;

const testCases = [
    "Check this out go.com it is cool",
    "www.google.com",
    "https://twitter.com",
    "Just some text",
    "mail.google.com/mail/u/0",
    "bit.ly/12345"
];

testCases.forEach(text => {
    console.log(`Text: "${text}"`);
    const matches = text.match(URL_REGEX);
    console.log("Matches:", matches);
    console.log("---");
});
