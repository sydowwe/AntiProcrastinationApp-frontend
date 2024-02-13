import { IdLabelOption } from "../classes/IdLabelOption";


export function useActivitySelection(selectOptions: any){
    function populateSelects(dataKey: keyof typeof selectOptions, url: string) {
        axios
            .post(url)
            .then((response) => {
                selectOptions[dataKey] = IdLabelOption.listFromObjects(response.data);
            })
            .catch((error) => {
                console.log(error);
            });
    }
    return {
        populateSelects
    }
}