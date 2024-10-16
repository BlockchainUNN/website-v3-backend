import path from "path";
import { transporter } from "../config/mailer";
import pug from "pug";
import juice from "juice";
import fs from "fs";

const FROM_MAIL = process.env.FROM_MAIL;

export async function sendMail(
  to: string,
  subject: string,
  templateName: string,
  options: any
) {
  try {
    // Get template file, and css file
    const templatePath = path.join(
      __dirname,
      "../templates",
      `${templateName}.pug`
    );
    const cssFile = path.join(__dirname, "../templates/css", "styles.css");
    const cssFileContents = fs.readFileSync(cssFile, "utf-8");

    // Send mail
    const templateFunction = pug.compileFile(templatePath);
    const info = await transporter.sendMail({
      from: `"The BlockchainUNN Team" <${FROM_MAIL}>`,
      to,
      subject,
      html: juice.inlineContent(templateFunction(options), cssFileContents), // Juice makes the external css file to be inline.
    });
    return { accepted: info.accepted, rejected: info.rejected };
  } catch (error) {
    console.log("Mailling Error ==>> ", error);
    throw error;
  }
}
