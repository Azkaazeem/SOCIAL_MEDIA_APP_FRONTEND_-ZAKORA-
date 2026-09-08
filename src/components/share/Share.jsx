import { useContext, useRef, useState } from "react";
import "./share.css";
import { PermMedia, PlayCircle, Article, Cancel } from "@mui/icons-material";
import { AuthContext } from "../../context/AuthContext";
import axios from "axios";
import FormattedContent from "../formattedContent/FormattedContent";

const Share = () => {
    const { user } = useContext(AuthContext);
    const PF = import.meta.env.VITE_PUBLIC_FOLDER || "/assets/";
    const desc = useRef();
    const articleTextareaRef = useRef();
    const [articleText, setArticleText] = useState("");
    const [isPreview, setIsPreview] = useState(false);
    const [files, setFiles] = useState([]);
    const [isArticle, setIsArticle] = useState(false);

    const handleFileChange = (e) => {
        setFiles(prev => [...prev, ...Array.from(e.target.files)]);
    };

    const removeFile = (indexToRemove) => {
        setFiles(files.filter((_, i) => i !== indexToRemove));
    };

    const applyFormatting = (prefix, suffix = "", defaultText = "Text") => {
        const textarea = articleTextareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentVal = textarea.value;
        const selectedText = currentVal.substring(start, end);

        const textToInsert = selectedText || defaultText;
        const replacement = `${prefix}${textToInsert}${suffix}`;
        const updatedVal = currentVal.substring(0, start) + replacement + currentVal.substring(end);

        textarea.value = updatedVal;
        setArticleText(updatedVal);

        // Keep focus and position cursor appropriately
        textarea.focus();
        setTimeout(() => {
            const newCursorPos = selectedText
                ? start + replacement.length
                : start + prefix.length;
            const selectionEnd = selectedText
                ? newCursorPos
                : newCursorPos + textToInsert.length;
            textarea.setSelectionRange(newCursorPos, selectionEnd);
        }, 0);
    };

    const submitHandler = async (e) => {
        e.preventDefault();

        const postDesc = isArticle ? articleText : (desc.current?.value || "");

        const newPost = {
            userId: user._id,
            desc: postDesc,
            img: [],
            video: []
        };

        if (files.length > 0) {
            await Promise.all(files.map(async (f) => {
                const data = new FormData();
                const filename = Date.now() + "_" + f.name;
                data.append("name", filename);
                data.append("file", f);
                try {
                    const res = await axios.post("/upload", data);
                    const cloudUrl = res.data?.url || filename;
                    
                    if (f.type.startsWith("image/")) {
                        newPost.img.push(cloudUrl);
                    } else if (f.type.startsWith("video/")) {
                        newPost.video.push(cloudUrl);
                    }
                } catch (err) {
                    console.log(err);
                }
            }));
        }

        try {
            await axios.post("/posts", newPost);
            if (desc.current) desc.current.value = "";
            setArticleText("");
            setIsPreview(false);
            setFiles([]);
            setIsArticle(false);
            window.dispatchEvent(new CustomEvent('postCreated'));
        } catch (err) {
            console.log(err);
        }
    };

    const resolvePath = (path) => path ? (path.startsWith("http") ? path : (PF.endsWith("/") ? PF : PF + "/") + (path.startsWith("/") ? path.slice(1) : path)) : "";

    return (
        <div className="share">
            <div className="shareWrapper">
                <div className="shareTop">
                    <img
                        className="shareProfileImg"
                        src={user?.profilePicture ? resolvePath(user.profilePicture) : "https://i.pinimg.com/736x/2c/3b/f6/2c3bf6dcf64197a30ee1efea7d198ddd.jpg"}
                        alt="profile"
                    />

                    {isArticle ? (
                        <div style={{ flex: 1, width: "100%" }}>
                            {/* Article Formatting Toolbar */}
                            <div className="shareFormatToolbar">
                                <button
                                    type="button"
                                    className="formatBtn"
                                    onClick={() => applyFormatting("**", "**", "Bold")}
                                    title="Bold"
                                >
                                    <strong>B</strong>
                                </button>
                                <button
                                    type="button"
                                    className="formatBtn"
                                    onClick={() => applyFormatting("*", "*", "Italic")}
                                    title="Italic"
                                >
                                    <em>I</em>
                                </button>
                                <button
                                    type="button"
                                    className="formatBtn"
                                    onClick={() => applyFormatting("<u>", "</u>", "Underline")}
                                    title="Underline"
                                >
                                    <u>U</u>
                                </button>
                                <span className="formatSeparator">|</span>
                                <button
                                    type="button"
                                    className="formatBtn"
                                    onClick={() => applyFormatting("# ", "", "Main Heading")}
                                    title="Large Heading"
                                >
                                    <strong>H1</strong>
                                </button>
                                <button
                                    type="button"
                                    className="formatBtn"
                                    onClick={() => applyFormatting("## ", "", "Subheading")}
                                    title="Subheading"
                                >
                                    <strong>H2</strong>
                                </button>
                                <button
                                    type="button"
                                    className="formatBtn"
                                    onClick={() => applyFormatting("> ", "", "Important quote")}
                                    title="Quote"
                                >
                                    <strong>“ ”</strong>
                                </button>
                                <button
                                    type="button"
                                    className="formatBtn"
                                    onClick={() => applyFormatting("• ", "", "List item")}
                                    title="Bullet List"
                                >
                                    • List
                                </button>
                                <button
                                    type="button"
                                    className="formatBtn"
                                    onClick={() => applyFormatting("`", "`", "code")}
                                    title="Code"
                                >
                                    &lt;/&gt;
                                </button>
                                <button
                                    type="button"
                                    className={`formatBtn previewToggleBtn ${isPreview ? 'active' : ''}`}
                                    onClick={() => setIsPreview(!isPreview)}
                                    title="Toggle Preview"
                                >
                                    {isPreview ? "✏️ Edit" : "👁️ Preview"}
                                </button>
                            </div>

                            {/* Article Textarea or Preview */}
                            {isPreview ? (
                                <div className="articlePreviewContainer">
                                    <div className="articlePreviewHeader">Article Live Preview</div>
                                    <FormattedContent content={articleText || "Start typing your article to preview formatting..."} />
                                </div>
                            ) : (
                                <textarea
                                    ref={articleTextareaRef}
                                    placeholder={"Write your article, " + (user?.username || "") + "... (Use formatting tools above!)"}
                                    className="shareInput shareArticleTextarea"
                                    value={articleText}
                                    onChange={(e) => setArticleText(e.target.value)}
                                />
                            )}
                        </div>
                    ) : (
                        <input
                            type="text"
                            placeholder={"What's on your mind " + (user?.username || "") + "?"}
                            className="shareInput"
                            ref={desc}
                            style={{ flex: 1 }}
                        />
                    )}
                </div>

                <hr className="shareHr" />
                
                {files.length > 0 && (
                    <div className="shareFilesContainer" style={{ display: "flex", flexWrap: "wrap", gap: "10px", padding: "0 20px 20px 20px" }}>
                        {files.map((f, i) => (
                            <div key={i} className="shareFilePreview" style={{ position: "relative" }}>
                                {f.type.startsWith("image/") ? (
                                    <img className="shareImg" src={URL.createObjectURL(f)} alt="" style={{ width: "150px", height: "150px", objectFit: "cover", borderRadius: "10px" }} />
                                ) : (
                                    <video className="shareImg" src={URL.createObjectURL(f)} style={{ width: "150px", height: "150px", objectFit: "cover", borderRadius: "10px" }} />
                                )}
                                <Cancel className="shareCancelImg" onClick={() => removeFile(i)} style={{ position: "absolute", top: "5px", right: "5px", cursor: "pointer", color: "white", backgroundColor: "rgba(0,0,0,0.5)", borderRadius: "50%" }} />
                            </div>
                        ))}
                    </div>
                )}

                <form className="shareBottom" onSubmit={submitHandler}>
                    <div className="shareOptions">
                        <label htmlFor="photo" className="shareOption">
                            <PermMedia htmlColor="tomato" className="shareIcon" />
                            <span className="shareOptionText">Photo</span>
                            <input style={{ display: "none" }} type="file" id="photo" multiple accept="image/*" onChange={handleFileChange} />
                        </label>

                        <label htmlFor="video" className="shareOption">
                            <PlayCircle htmlColor="blue" className="shareIcon" />
                            <span className="shareOptionText">Video</span>
                            <input style={{ display: "none" }} type="file" id="video" multiple accept="video/*" onChange={handleFileChange} />
                        </label>

                        <div
                            className={`shareOption ${isArticle ? 'shareOptionActive' : ''}`}
                            onClick={() => {
                                setIsArticle(!isArticle);
                                setIsPreview(false);
                            }}
                        >
                            <Article htmlColor="green" className="shareIcon" />
                            <span className="shareOptionText">Article {isArticle ? "✓" : ""}</span>
                        </div>
                    </div>
                    <button className="shareButton" type="submit">Share</button>
                </form>
            </div>
        </div>
    );
};

export default Share;