import org.apache.pdfbox.pdfparser.PDFStreamParser;
import org.apache.pdfbox.pdfwriter.ContentStreamWriter;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.common.PDStream;
import org.apache.pdfbox.util.PDFOperator;

import java.util.ArrayList;
import java.util.List;
import java.io.File;
import java.io.IOException;
import java.io.PrintWriter;

/**
 * Utility to extract text from a multiple page pdf file (untested) 
 * @author Manan
 * args[0] the original file
 * args[1] the location for the output
 */
public class MultiplePages {

    public static void main(String[] args) throws IOException {
        PDDocument document = null;
        try 
        {
            document = PDDocument.load(args[0]);
            if (document.isEncrypted()) {
                System.err.println("Error: Document is Encrypted");
                System.exit(1);
            }
            
            List pages = document.getDocumentCatalog().getAllPages();
            for (int i = 0; i < pages.size(); i++) 
            {
                PDPage page = (PDPage) pages.get(i);
                PDFStreamParser parser = new PDFStreamParser(page.getContents());
                parser.parse();
                List tokens = parser.getTokens();
                List newTokens = new ArrayList();
                
                //parse tokens
                for (int j = 0; j < tokens.size(); j++) 
                {
                    Object token = tokens.get(j);
                    if (token instanceof PDFOperator) {
                        PDFOperator op = (PDFOperator) token;
                        //special format op
                        if (op.getOperation().equals("TJ") || op.getOperation().equals("Tj")) {
                            newTokens.remove(newTokens.size() - 1);
                            continue;
                        }
                    }
                    //add it to the list of new tokens
                    newTokens.add(token);
                }
                String fn = "";
                PrintWriter out = new PrintWriter(new File(args[1]));
                for(Object t: newTokens){
                    //print each token to the out file
                    out.print(t);
                    out.print(" ");
                }
                //write to PDF file
                /*
                PDStream newContents = new PDStream(document);
                ContentStreamWriter writer = new ContentStreamWriter(newContents.createOutputStream());
                writer.writeTokens(newTokens);                
                newContents.addCompression();
                page.setContents(newContents);
                document.save(args[1]);
                */
            }
        } finally {
            if (document != null) document.close();
        }
    }
}
