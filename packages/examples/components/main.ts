import { defineComponent } from "@hull/framework/runtime/component";
import { hString } from "@hull/framework/runtime/h";

const Dummy = defineComponent({
  viewFunction() {
    console.log("[view function] this context: ", this);

    return hString(`hello, ${this.state.name}`);
  },
  initialState: (props: { secondName: string }) => {
    return {
      name: `World ${props.secondName}`,
    };
  },
});

const a = new Dummy({ secondName: "of technical prudence" });

const parentEl = document.querySelector("div#app") as HTMLDivElement;

a.mount(parentEl);
