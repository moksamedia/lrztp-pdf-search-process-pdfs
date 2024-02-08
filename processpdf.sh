IN_FILE="$1"
FILE_NAME=$(basename "${IN_FILE}")
BASE_NAME="${FILE_NAME%%.*}"
OUT_FILE="${BASE_NAME}_ocr.pdf"
TXT_FILE="$BASE_NAME.txt"
OUTPUT_DIR="./pdf-output/$BASE_NAME"

if [ "$2" == "--force-rm" ]; then
  rm -r "$OUTPUT_DIR"
fi

if [ -d "$OUTPUT_DIR" ]; then
  echo "'$OUTPUT_DIR' exists."
  read -p "Delete '$OUTPUT_DIR'(y/n):" yn
    case $yn in
        [Yy]* ) rm -r "$OUTPUT_DIR";;
        [Nn]* ) exit;;
        * ) echo "Please answer (y)es or (n)o.";;
    esac
fi

echo "'$IN_FILE' '$BASE_NAME' '$OUTPUT_DIR' '$OUT_FILE' '$TXT_FILE'"

echo "Making output directory: $OUTPUT_DIR"
mkdir "$OUTPUT_DIR"

echo "Copying original pdf '${IN_FILE}' to '$OUTPUT_DIR'"
cp "$IN_FILE" "$OUTPUT_DIR"

num_pages=`pdfinfo "$IN_FILE" | awk '/^Pages:/ {print $2}'`
echo "num pages in pdf=$num_pages"

echo -e "numpages=$num_pages" >> "./pdf-to-process/fields.properties"
cp "./pdf-to-process/fields.properties" "$OUTPUT_DIR/fields.properties"

echo "Exporting text of non-ocr document to '${OUTPUT_DIR}/${BASE_NAME}.txt'"
#pdftotext "${IN_FILE}" "${OUTPUT_DIR}/${BASE_NAME}.txt"
for ((i = 1; i <= $num_pages; i++))
do
  PAGE=`printf "%04d" $i`
  echo "processing pdftotext page $PAGE '${OUTPUT_DIR}/${BASE_NAME}_pp${PAGE}.txt'"
  pdftotext -f $i -l $i "$IN_FILE" "${OUTPUT_DIR}/${BASE_NAME}_pp${PAGE}.txt"
done

echo "OCR'ring using ocrmypdf"

ocrmypdf -l bod+eng --force-ocr --output-type pdf "$IN_FILE" "${OUTPUT_DIR}/${OUT_FILE}"
status=$?

if [ $status -eq 0 ]
then
  num_pages=`pdfinfo "${OUTPUT_DIR}/$OUT_FILE" | awk '/^Pages:/ {print $2}'`
  echo "num pages=$num_pages"
  #echo "procssing pdftotext whole file: '${OUTPUT_DIR}/${BASE_NAME}_ocr.txt'"
  #pdftotext "${OUTPUT_DIR}/$OUT_FILE" "${OUTPUT_DIR}/${BASE_NAME}_ocr.txt"
  for ((i = 1; i <= $num_pages; i++))
  do
    PAGE=`printf "%04d" $i`
    echo "processing pdftotext page $PAGE '${OUTPUT_DIR}/${BASE_NAME}_ocr_pp${PAGE}.txt'"
    pdftotext -f $i -l $i "${OUTPUT_DIR}/$OUT_FILE" "${OUTPUT_DIR}/${BASE_NAME}_ocr_pp${PAGE}.txt"
  done
  exit 0
else
  echo "ocrmypdf exited with status $status"
  exit 1
fi
