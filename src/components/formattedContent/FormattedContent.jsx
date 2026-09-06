import React from "react";
import "./formattedContent.css";

// Helper to parse inline markdown (bold, italic, underline, code) into React elements
const parseInline = (text) => {
  if (!text) return null;

  // Regex to match **bold**, *italic*, <u>underline</u>, and `code`
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|<u>.*?<\/u>|`[^`]+`)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("<u>") && part.endsWith("</u>") && part.length >= 7) {
      return <u key={index}>{part.slice(3, -4)}</u>;
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      return <code key={index} className="fcInlineCode">{part.slice(1, -1)}</code>;
    }
    return part;
  });
};

const FormattedContent = ({ content, className = "" }) => {
  if (!content) return null;

  const lines = content.split("\n");
  const elements = [];
  let currentList = [];

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="fcList">
          {currentList.map((item, idx) => (
            <li key={idx}>{parseInline(item)}</li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trimEnd();

    // Check bullet list item
    if (line.startsWith("• ") || line.startsWith("- ") || line.startsWith("* ")) {
      currentList.push(line.replace(/^[•\-\*]\s*/, ""));
      return;
    } else {
      flushList();
    }

    // Check H1 heading
    if (line.startsWith("# ")) {
      elements.push(
        <h3 key={idx} className="fcHeading1">
          {parseInline(line.slice(2))}
        </h3>
      );
      return;
    }

    // Check H2 heading
    if (line.startsWith("## ")) {
      elements.push(
        <h4 key={idx} className="fcHeading2">
          {parseInline(line.slice(3))}
        </h4>
      );
      return;
    }

    // Check blockquote
    if (line.startsWith("> ")) {
      elements.push(
        <blockquote key={idx} className="fcQuote">
          {parseInline(line.slice(2))}
        </blockquote>
      );
      return;
    }

    // Empty line
    if (line.trim() === "") {
      elements.push(<div key={idx} className="fcEmptyLine" />);
      return;
    }

    // Regular text line
    elements.push(
      <p key={idx} className="fcParagraph">
        {parseInline(line)}
      </p>
    );
  });

  flushList();

  return <div className={`formattedContent ${className}`}>{elements}</div>;
};

export default FormattedContent;
