import { SelectOption } from "@/classes/SelectOption";


export function useActivitySelection(selectOptions: any){
    function populateSelects(dataKey: keyof typeof selectOptions, url: string) {
        axios
            .post(url)
            .then((response) => {
                selectOptions[dataKey] = SelectOption.listFromObjects(response.data);
            })
            .catch((error) => {
                console.log(error);
            });
    }
    return {
        populateSelects
    }
}