export function serializeToWhatsApp(json) {
  if (!json || !json.content) return "";

  return json.content.map(serializeNode).join("\n");
}

function serializeNode(node) {
  if (!node) return "";

  switch (node.type) {
    case "paragraph":
      return serializeContent(node.content);
    case "bulletList":
      return node.content
        .map((li) => `• ${serializeContent(li.content)}`)
        .join("\n");
    case "orderedList":
      return node.content
        .map((li, index) => `${index + 1}. ${serializeContent(li.content)}`)
        .join("\n");
    case "listItem":
      return serializeContent(node.content);
    case "text":
      return serializeText(node);
    case "hardBreak":
      return "\n";
    default:
      return serializeContent(node.content);
  }
}

function serializeContent(content) {
  if (!content) return "";
  return content.map(serializeNode).join("");
}

function serializeText(node) {
  let text = node.text;

  if (!node.marks) return text;

  // Apply marks in a specific order if needed, but simple wrapping works for most
  node.marks.forEach((mark) => {
    switch (mark.type) {
      case "bold":
        text = `*${text}*`;
        break;
      case "italic":
        text = `_${text}_`;
        break;
      case "strike":
        text = `~${text}~`;
        break;
      case "code":
        text = `\`${text}\``;
        break;
    }
  });

  return text;
}
