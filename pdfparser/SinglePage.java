import org.apache.pdfbox.exceptions.InvalidPasswordException;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.util.PDFTextStripperByArea;
import java.awt.Rectangle;
import java.io.File;
import java.io.PrintWriter;
import java.util.List;
import org.apache.pdfbox.PDFReader;

/**
 * Utility to extract text from single page pdf file (untested) 
 * args[0] the original file
 * args[1] the password, or "" for no encryption
 * args[2] the directory to extract the text
 * @author Manan
 */
public class SinglePage {

    public static void main(String[] args) throws Exception {
        PDDocument document = null;
        String password = "";
        try 
        {
            document = PDDocument.load(args[0]);
            if (document.isEncrypted()) {
                try 
                {
                    //can input the password
                    if(args[1]!=null) password = args[1];
                    document.decrypt(password);
                } catch (InvalidPasswordException e) {
                    System.err.println("Error: Document is encrypted with a password.");
                    System.exit(1);
                }
            }
            PDFTextStripperByArea stripper = new PDFTextStripperByArea();
            stripper.setSortByPosition(true);
            String text = stripper.getText(document);
            System.out.println("Text in the area:" + text);
            System.out.println("Saving to file...");
            PrintWriter out = new PrintWriter(new File(args[3]));
            out.println(text);
            System.out.println("Saved");
        } 
        finally {
            if (document != null) document.close();
        }
    }
}
