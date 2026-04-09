// Auto-generated code using the Fetch API
// Operation: readproperty on "status"

async function main() {
    const url = "https://mylamp.example.com/status";

    const response = await fetch(url, {
        method: "GET",
    });

    const data = await response.json();
    console.log("Response:", data);
}

main();